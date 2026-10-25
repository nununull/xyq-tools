import argparse
import hashlib
import io
import json
import os
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
ASSET_ROOT = ROOT / 'public/guide-images'
INDEX_ROOT = ROOT / 'src/data/guide-images'
THUMBNAIL_SIZE = (480, 320)


def log(message, **context):
    """使用单行中文日志记录压缩进度、文件体积和校验结果。"""
    print(json.dumps({'msg': message, **context}, ensure_ascii=False), flush=True)


def resolve_image(root, relative):
    """把索引路径限制在明确的资源目录内，拒绝越界读写。"""
    base = root.resolve()
    target = (base / relative).resolve()
    if not target.is_relative_to(base):
        raise ValueError(f'图片路径越界：{relative}，根目录={base}，目标={target}')
    return target


def save_asset(data, directory, extension, size):
    """按内容哈希保存资源，同内容只存一份，临时文件原子替换。"""
    digest = hashlib.sha256(data).hexdigest()
    relative = f'{directory}/{digest[:20]}.{extension}'
    destination = resolve_image(ASSET_ROOT, relative)
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists() and hashlib.sha256(destination.read_bytes()).hexdigest() != digest:
        raise ValueError(f'资源哈希前缀冲突：{relative}')
    temporary = destination.with_name(f'{destination.name}.{os.getpid()}.tmp')
    temporary.write_bytes(data)
    temporary.replace(destination)
    return {'file': relative, 'width': size[0], 'height': size[1], 'hash': digest}


def optimize_image(source_root, image):
    """原图仅接受逐像素一致且更小的无损编码，缩略图由完整原图单向生成。"""
    source = resolve_image(source_root, image['file'])
    raw = source.read_bytes()
    if hashlib.sha256(raw).hexdigest() != image['hash']:
        raise ValueError(f'原图哈希不符：{image["file"]}')
    with Image.open(io.BytesIO(raw)) as original:
        original.load()
        if original.size != (image['width'], image['height']):
            raise ValueError(f'原图尺寸不符：{image["file"]}')
        size = original.size
        selected = raw
        extension = source.suffix.lower().lstrip('.')
        # JPEG 保留既有编码，动画和超过 WebP 尺寸上限的图片也保留原文件。
        if original.format == 'PNG' and getattr(original, 'n_frames', 1) == 1 and max(size) < 16384 and original.mode in {'1', 'L', 'LA', 'P', 'RGB', 'RGBA'}:
            pixels = original.convert('RGBA')
            metadata = {key: original.info[key] for key in ('icc_profile', 'exif', 'xmp') if original.info.get(key)}
            encoded = io.BytesIO()
            pixels.save(encoded, format='WEBP', lossless=True, quality=80, method=4, exact=True, **metadata)
            candidate = encoded.getvalue()
            if len(candidate) < len(raw):
                with Image.open(io.BytesIO(candidate)) as restored:
                    restored.load()
                    if restored.size != size or restored.convert('RGBA').tobytes() != pixels.tobytes():
                        raise ValueError(f'无损压缩像素不一致：{image["file"]}')
                selected, extension = candidate, 'webp'
        full = save_asset(selected, 'originals', extension, size)
        thumbnail = ImageOps.exif_transpose(original).convert('RGBA')
        thumbnail.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
        encoded_thumbnail = io.BytesIO()
        thumbnail.save(encoded_thumbnail, format='WEBP', quality=75, method=4, exact=True)
        small = save_asset(encoded_thumbnail.getvalue(), 'thumbnails', 'webp', thumbnail.size)
        return {**full, 'thumbnail': small}, len(raw), len(selected)


def validate_archive(archives):
    """发布索引前确认全部原图和缩略图存在、可完整解码且与索引匹配。"""
    referenced = {}
    for archive in archives.values():
        for guide in archive['guides'].values():
            for image in guide['images']:
                for resource in (image, image['thumbnail']):
                    referenced[resource['file']] = resource
    for relative, resource in referenced.items():
        file = resolve_image(ASSET_ROOT, relative)
        if hashlib.sha256(file.read_bytes()).hexdigest() != resource['hash']:
            raise ValueError(f'生成资源哈希不符：{relative}')
        with Image.open(file) as image:
            image.load()
            if image.size != (resource['width'], resource['height']):
                raise ValueError(f'生成资源尺寸不符：{relative}')
    return referenced


def main():
    """从归档索引生成本地原图和缩略图，完整验证后才更新索引并清理废资源。"""
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description='无损压缩攻略原图并生成独立缩略图；依赖 Pillow。')
    parser.add_argument('--source-root', type=Path, default=ASSET_ROOT)
    parser.add_argument('--workers', type=int, default=min(6, os.cpu_count() or 1))
    options = parser.parse_args()
    source_root = options.source_root.resolve()
    archives = {file: json.loads(file.read_text(encoding='utf-8')) for file in sorted(INDEX_ROOT.glob('*.json'))}
    unique = {}
    for archive in archives.values():
        for guide in archive['guides'].values():
            for image in guide['images']:
                unique.setdefault(image['hash'], image)
    if not unique:
        raise ValueError('没有可优化的攻略图片')
    # 启动子进程前建立并固定输出根目录，避免 Windows 在目录创建期间解析出不同路径。
    for directory in ('originals', 'thumbnails'):
        (ASSET_ROOT / directory).mkdir(parents=True, exist_ok=True)
    log('开始优化攻略图片', images=len(unique), source=str(source_root), workers=options.workers)
    optimized = {}
    before = after = 0
    with ProcessPoolExecutor(max_workers=max(1, min(8, options.workers))) as pool:
        pending = {pool.submit(optimize_image, source_root, image): digest for digest, image in unique.items()}
        for future in as_completed(pending):
            result, original_bytes, selected_bytes = future.result()
            optimized[pending[future]] = result
            before += original_bytes
            after += selected_bytes
            if len(optimized) % 50 == 0 or len(optimized) == len(unique):
                log('图片优化进度', completed=len(optimized), total=len(unique), originalBytes=before, optimizedBytes=after)
    for archive in archives.values():
        for guide in archive['guides'].values():
            guide['images'] = [{**image, **optimized[image['hash']]} for image in guide['images']]
    referenced = validate_archive(archives)
    for file, archive in archives.items():
        temporary = file.with_suffix('.json.tmp')
        temporary.write_text(json.dumps(archive, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        temporary.replace(file)
    # 仅清理固定输出目录中不再被任何归档引用的文件，不触碰输入目录和其他素材。
    for directory in ('originals', 'thumbnails'):
        for file in (ASSET_ROOT / directory).glob('*'):
            resolved = resolve_image(ASSET_ROOT, file.relative_to(ASSET_ROOT))
            if resolved.is_file() and resolved.relative_to(ASSET_ROOT).as_posix() not in referenced:
                resolved.unlink()
    full_bytes = sum(resolve_image(ASSET_ROOT, relative).stat().st_size for relative in referenced if relative.startswith('originals/'))
    thumbnail_bytes = sum(resolve_image(ASSET_ROOT, relative).stat().st_size for relative in referenced if relative.startswith('thumbnails/'))
    log('攻略图片优化完成', images=len(unique), originalBytes=before, fullBytes=full_bytes, thumbnailBytes=thumbnail_bytes, totalBytes=full_bytes + thumbnail_bytes)


if __name__ == '__main__':
    main()

from pathlib import Path
import json
from PIL import Image, ImageChops, ImageDraw, ImageOps

ROOT = Path.cwd()
SOURCE_DIR = ROOT / "\u56fe\u7247"
OUTPUT_DIR = ROOT / "assets" / "tiles"
SIZE = 512
PADDING = 8

def image_files():
    paths = []
    for path in sorted(SOURCE_DIR.iterdir(), key=lambda item: item.name.lower()):
        if not path.is_file():
            continue
        try:
            with Image.open(path) as image:
                image.verify()
            paths.append(path)
        except Exception:
            print(f"skip\t{path.name}\tnot a supported image")
    return paths


def alpha_bbox(image):
    if "A" not in image.getbands():
        return None
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 10 else 0).getbbox()
    if not bbox:
        return None

    left, top, right, bottom = bbox
    area = (right - left) * (bottom - top)
    full_area = image.size[0] * image.size[1]
    if area > full_area * 0.985:
        return None
    return bbox


def border_color(image):
    rgb = image.convert("RGB")
    width, height = rgb.size
    samples = []
    for x in range(width):
      samples.append(rgb.getpixel((x, 0)))
      samples.append(rgb.getpixel((x, height - 1)))
    for y in range(height):
      samples.append(rgb.getpixel((0, y)))
      samples.append(rgb.getpixel((width - 1, y)))
    channels = list(zip(*samples))
    return tuple(sorted(channel)[len(channel) // 2] for channel in channels)


def background_bbox(image):
    rgb = image.convert("RGB")
    bg = Image.new("RGB", rgb.size, border_color(rgb))
    diff = ImageChops.difference(rgb, bg).convert("L")
    mask = diff.point(lambda value: 255 if value > 22 else 0)
    bbox = mask.getbbox()
    if not bbox:
        return None

    left, top, right, bottom = bbox
    area = (right - left) * (bottom - top)
    full_area = rgb.size[0] * rgb.size[1]
    if area < full_area * 0.08:
        return None
    return bbox


def content_bbox(image):
    bbox = alpha_bbox(image)
    if bbox:
        inner = background_bbox(image.crop(bbox))
        if inner:
            left, top, _, _ = bbox
            return (
                left + inner[0],
                top + inner[1],
                left + inner[2],
                top + inner[3],
            )
        return bbox
    return background_bbox(image)


def square_from_bbox(bbox, image_size):
    width, height = image_size
    left, top, right, bottom = bbox
    box_width = right - left
    box_height = bottom - top
    side = max(box_width, box_height) * 1.08
    side = min(max(side, min(width, height) * 0.22), max(width, height))
    cx = (left + right) / 2
    cy = (top + bottom) / 2
    left = int(round(cx - side / 2))
    top = int(round(cy - side / 2))
    right = left + int(round(side))
    bottom = top + int(round(side))

    if left < 0:
        right -= left
        left = 0
    if top < 0:
        bottom -= top
        top = 0
    if right > width:
        left -= right - width
        right = width
    if bottom > height:
        top -= bottom - height
        bottom = height

    left = max(0, left)
    top = max(0, top)
    return (left, top, right, bottom)


def center_square(image):
    width, height = image.size
    side = min(width, height)
    left = (width - side) // 2
    top = (height - side) // 2
    return (left, top, left + side, top + side)


def circle_mask(size):
    scale = 4
    large_size = size * scale
    mask = Image.new("L", (large_size, large_size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, large_size - 1, large_size - 1), fill=255)
    return mask.resize((size, size), Image.Resampling.LANCZOS)


def is_light_background(pixel):
    red, green, blue, alpha = pixel
    if alpha < 16:
        return False
    return min(red, green, blue) > 245 and max(red, green, blue) - min(red, green, blue) < 22


def remove_connected_light_background(image):
    width, height = image.size
    pixels = image.load()
    visited = bytearray(width * height)
    stack = []

    def add_if_background(x, y):
        index = y * width + x
        if visited[index] or not is_light_background(pixels[x, y]):
            return
        visited[index] = 1
        stack.append((x, y))

    for x in range(width):
        add_if_background(x, 0)
        add_if_background(x, height - 1)
    for y in range(height):
        add_if_background(0, y)
        add_if_background(width - 1, y)

    for y in range(height):
        for x in range(width):
            if not is_light_background(pixels[x, y]):
                continue
            touches_transparency = False
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if nx < 0 or nx >= width or ny < 0 or ny >= height or pixels[nx, ny][3] < 16:
                    touches_transparency = True
                    break
            if touches_transparency:
                add_if_background(x, y)

    while stack:
        x, y = stack.pop()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < width and 0 <= ny < height:
                add_if_background(nx, ny)

    if not any(visited):
        return image

    output = image.copy()
    output_pixels = output.load()
    for y in range(height):
        for x in range(width):
            if visited[y * width + x]:
                red, green, blue, _ = output_pixels[x, y]
                output_pixels[x, y] = (red, green, blue, 0)
    return output


def crop_icon(path):
    source = Image.open(path)
    image = ImageOps.exif_transpose(source).convert("RGBA")
    bbox = content_bbox(image) or center_square(image)
    crop_box = square_from_bbox(bbox, image.size)
    cropped = image.crop(crop_box)

    content_size = SIZE - PADDING * 2
    cropped = ImageOps.fit(cropped, (content_size, content_size), Image.Resampling.LANCZOS)
    cropped = remove_connected_light_background(cropped)

    canvas = Image.new("RGBA", (SIZE, SIZE), (255, 255, 255, 0))
    rounded = Image.new("RGBA", (content_size, content_size), (255, 255, 255, 0))
    rounded.alpha_composite(cropped, (0, 0))
    rounded.putalpha(ImageChops.multiply(rounded.getchannel("A"), circle_mask(content_size)))
    canvas.alpha_composite(rounded, (PADDING, PADDING))
    return canvas, crop_box


def make_contact_sheet(outputs):
    thumb = 160
    label_h = 28
    columns = 4
    rows = (len(outputs) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * thumb, rows * (thumb + label_h)), "white")

    for index, item in enumerate(outputs):
        image = Image.open(item["output"]).convert("RGBA")
        image.thumbnail((thumb - 18, thumb - 18), Image.Resampling.LANCZOS)
        tile = Image.new("RGBA", (thumb, thumb), (245, 248, 252, 255))
        tile.alpha_composite(image, ((thumb - image.size[0]) // 2, (thumb - image.size[1]) // 2))
        x = (index % columns) * thumb
        y = (index // columns) * (thumb + label_h)
        sheet.paste(tile.convert("RGB"), (x, y))
    return sheet


def write_manifest(outputs):
    manifest_path = OUTPUT_DIR / "manifest.js"
    asset_paths = [
        item["output"].relative_to(ROOT).as_posix()
        for item in outputs
    ]
    manifest_path.write_text(
        "window.MILEGEMI_TILE_ASSETS = "
        + json.dumps(asset_paths, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )
    return manifest_path


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    outputs = []
    for index, path in enumerate(image_files(), start=1):
        icon, crop_box = crop_icon(path)
        output = OUTPUT_DIR / f"tile-{index:02}.png"
        icon.save(output, optimize=True)
        outputs.append({"source": path, "output": output, "crop_box": crop_box})
        print(f"{index:02}\t{path.name}\t{output.relative_to(ROOT)}\tcrop={crop_box}")

    if outputs:
        manifest_path = write_manifest(outputs)
        sheet = make_contact_sheet(outputs)
        sheet_path = OUTPUT_DIR / "preview-sheet.jpg"
        sheet.save(sheet_path, quality=92)
        print(f"manifest\t{manifest_path.relative_to(ROOT)}")
        print(f"preview\t{sheet_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

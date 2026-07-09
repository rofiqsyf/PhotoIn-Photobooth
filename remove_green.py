import os
import numpy as np
from PIL import Image

def remove_green_screen(image_path):
    try:
        img = Image.open(image_path).convert("RGBA")
        
        # Scale down if image is massively large to prevent OOM
        max_dim = 2000
        if img.width > max_dim or img.height > max_dim:
            ratio = min(max_dim / img.width, max_dim / img.height)
            new_w, new_h = int(img.width * ratio), int(img.height * ratio)
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            print(f"Resized down to {new_w}x{new_h}")
            
        data = np.array(img)
        
        r = data[:, :, 0].astype(np.float32)
        g = data[:, :, 1].astype(np.float32)
        b = data[:, :, 2].astype(np.float32)
        a = data[:, :, 3].astype(np.float32)
        
        # Target specific color #7ed957 (R: 126, G: 217, B: 87)
        target_r, target_g, target_b = 126.0, 217.0, 87.0
        
        # Calculate Euclidean color distance to the target color
        distance = np.sqrt((r - target_r)**2 + (g - target_g)**2 + (b - target_b)**2)
        
        # Soft transition thresholds for anti-aliasing
        # t_low: distance below this -> pixel is fully transparent (factor = 1)
        # t_high: distance above this -> pixel is untouched (factor = 0)
        t_low = 50.0
        t_high = 120.0
        
        # Calculate transparency factor (1.0 = remove completely, 0.0 = keep completely)
        factor = 1.0 - np.clip((distance - t_low) / (t_high - t_low), 0, 1)
        
        is_chroma = factor > 0
        
        if np.any(is_chroma):
            # Apply soft alpha matting
            new_alpha = a.copy()
            new_alpha[is_chroma] = a[is_chroma] * (1 - factor[is_chroma])
            
            # Despill: pull the color of semi-transparent edges towards neutral grey
            # to remove the specific #7ed957 tint
            grey = (r[is_chroma] + g[is_chroma] + b[is_chroma]) / 3
            g[is_chroma] = np.minimum(g[is_chroma], grey)
            
            data[:, :, 0] = r.astype(np.uint8)
            data[:, :, 1] = g.astype(np.uint8)
            data[:, :, 2] = b.astype(np.uint8)
            data[:, :, 3] = new_alpha.astype(np.uint8)
            
            new_img = Image.fromarray(data, "RGBA")
            new_img.save(image_path, "PNG")
            print(f"Processed (Specific Color #7ed957): {os.path.basename(image_path)}")
        else:
            print(f"Target color #7ed957 not found in: {os.path.basename(image_path)}")
            
    except Exception as e:
        print(f"Error processing {image_path}: {e}")

if __name__ == "__main__":
    frames_dir = os.path.join(os.path.dirname(__file__), "assets", "frames")
    js_dir = os.path.join(os.path.dirname(__file__), "js")
    
    import time
    print("Mata-mata folder diaktifkan! Script ini akan terus memantau folder assets/frames...")
    print("Biarkan jendela ini terbuka. Setiap kali Anda memasukkan gambar, sistem akan otomatis memprosesnya.")
    
    last_files = set()
    
    while True:
        png_files = []
        current_files = set(os.listdir(frames_dir))
        
        # Check if there are new files or deleted files
        if current_files != last_files:
            for filename in current_files:
                if filename.lower().endswith(".png"):
                    filepath = os.path.join(frames_dir, filename)
                    remove_green_screen(filepath)
                    png_files.append(filename)
            
            # Generate frames_config.js
            import json
            configs = []
            for f in png_files:
                name = os.path.splitext(f)[0].replace('_', ' ')
                configs.append({
                    "name": name,
                    "event_id": "evt_custom",
                    "image_path": f"assets/frames/{f}"
                })
            
            js_content = f"window.PHOTOBOOTH_FRAMES = {json.dumps(configs, indent=2)};"
            with open(os.path.join(js_dir, "frames_config.js"), "w", encoding="utf-8") as f:
                f.write(js_content)
                
            print(f"[{time.strftime('%H:%M:%S')}] Sistem diperbarui! {len(configs)} border ditemukan.")
            last_files = current_files
            
        time.sleep(3)

#!/usr/bin/env python3
"""把懶人包裡內嵌的大型照片拿掉，做成輕量的參考版／新行程起點。
用法：strip_media.py <來源 index.html> <輸出 html>
- `const IMG={…};` 清成 `const IMG={};`（卡片會改用 wiki 備援圖或灰底佔位）
- 其他超過 2 KB 的 base64 圖（例如 AREAMAPS 官方地圖）換成灰色 SVG 佔位圖
"""
import re, sys, os
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
a = s.index('const IMG={'); e = s.index('\nconst DAYS=', a)
s = s[:a] + 'const IMG={}; // 照片用 addphotos.py 加入\n' + s[e:]
PH = "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2210%22%3E%3Crect width=%2216%22 height=%2210%22 fill=%22%23ddd%22/%3E%3C/svg%3E"
s, n = re.subn(r"data:image/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]{2000,}", PH, s)
open(dst, 'w', encoding='utf-8').write(s)
print('✓ %s → %s（%.2f MB → %.2f MB，另換掉 %d 張大圖）' % (src, dst, os.path.getsize(src)/1048576, os.path.getsize(dst)/1048576, n))

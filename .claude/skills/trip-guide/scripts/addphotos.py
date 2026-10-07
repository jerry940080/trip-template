#!/usr/bin/env python3
"""把照片轉成 WebP 並嵌進 index.html 的 IMG。
用法：addphotos.py [--html index.html] <cardKey> <圖檔1> [圖檔2 ...]
規則：橫式縮到寬 1000、直式縮到高 1000，q78 WebP；第一張是卡片封面。"""
import sys, base64, io, os, re
from PIL import Image

args=sys.argv[1:]
HTML='index.html'
if args[:1]==['--html']: HTML, args = args[1], args[2:]
key, files = args[0], args[1:]
assert files, '沒有給圖檔'

uris=[]
for f in files:
    im=Image.open(f).convert('RGB')
    w,h=im.size
    if w>=h: nw=min(1000,w); nh=round(h*nw/w)
    else:    nh=min(1000,h); nw=round(w*nh/h)
    im=im.resize((nw,nh), Image.LANCZOS)
    buf=io.BytesIO(); im.save(buf,'WEBP',quality=78,method=6)
    b=buf.getvalue()
    print('  %-22s %dx%d -> %dx%d  %4.0f KB'%(os.path.basename(f),w,h,nw,nh,len(b)/1024))
    uris.append('data:image/webp;base64,'+base64.b64encode(b).decode())

s=open(HTML,encoding='utf-8').read()
anchor='const IMG={'
assert s.count(anchor)==1
assert not re.search(r"(?:\{|\n )"+key+r":\[?'data:image",s), key+' 已經有照片了，先手動移除'
val='['+','.join("'%s'"%u for u in uris)+']' if len(uris)>1 else "'%s'"%uris[0]
s=s.replace(anchor, anchor+key+':'+val+',\n ',1)
open(HTML,'w',encoding='utf-8').write(s)
print('✓ %s 嵌入 %d 張，檔案 %.2f MB'%(key,len(uris),os.path.getsize(HTML)/1048576))

#!/usr/bin/env python3
"""產生地圖底圖資料：海岸線 LAND（必要）與鐵道 LINES（選用），裁切到行程範圍並簡化。

用法：
  make_geo.py --bbox 138.25,34.55,140.55,35.90 [--src japan|world] [--tol 0.0004]
              [--rails world] [--write index.html]

  --bbox   經度0,緯度0,經度1,緯度1（行程所有地點外擴約 0.2°）
  --src    japan＝dataofjapan/land（日本，較細）；world＝Natural Earth 10m land（全球）
  --rails  world＝Natural Earth 10m railroads（全球，線形粗、沒有路線名）。
           日本行程想要真實路線名與顏色，請改用国土数値情報 N02 鉄道データ（CC BY 4.0）自行轉換，
           格式見 references/architecture.md 的 LINES。
  --write  直接取代檔案裡 `const LAND=` 與（有 --rails 時）`const LINES=` 那一行；不給就印到 stdout。

LAND 格式：[[ [lon,lat], ... ], ...]（每個多邊形一個外環）；LINES：[{"n":名稱,"c":顏色,"s":[[[lon,lat],...],...]}]
"""
import argparse, json, re, sys, urllib.request

SRC = {
  'japan': 'https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson',
  'world': 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_land.geojson',
}
RAILS = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_railroads.geojson'

def fetch(u):
    print('下載', u, file=sys.stderr)
    with urllib.request.urlopen(u, timeout=120) as r: return json.load(r)

def rings(geom):
    t, c = geom['type'], geom['coordinates']
    if t == 'Polygon': return [c[0]]
    if t == 'MultiPolygon': return [p[0] for p in c]
    return []

def lines(geom):
    t, c = geom['type'], geom['coordinates']
    if t == 'LineString': return [c]
    if t == 'MultiLineString': return c
    return []

def clip_poly(pts, b):  # Sutherland–Hodgman，四個邊各切一次
    x0, y0, x1, y1 = b
    def cut(P, inside, inter):
        out = []
        for i in range(len(P)):
            a, c = P[i - 1], P[i]
            if inside(c):
                if not inside(a): out.append(inter(a, c))
                out.append(c)
            elif inside(a): out.append(inter(a, c))
        return out
    def ix(xv): return lambda a, c: [xv, a[1] + (c[1] - a[1]) * (xv - a[0]) / (c[0] - a[0])]
    def iy(yv): return lambda a, c: [a[0] + (c[0] - a[0]) * (yv - a[1]) / (c[1] - a[1]), yv]
    P = [p[:2] for p in pts]
    for inside, inter in ((lambda p: p[0] >= x0, ix(x0)), (lambda p: p[0] <= x1, ix(x1)),
                          (lambda p: p[1] >= y0, iy(y0)), (lambda p: p[1] <= y1, iy(y1))):
        if not P: break
        P = cut(P, inside, inter)
    return P

def clip_line(pts, b):
    x0, y0, x1, y1 = b; segs, cur = [], []
    for p in pts:
        if x0 <= p[0] <= x1 and y0 <= p[1] <= y1: cur.append(p[:2])
        elif cur: segs.append(cur); cur = []
    if cur: segs.append(cur)
    return [s for s in segs if len(s) > 1]

def rdp(P, eps):
    if len(P) < 3: return P
    (ax, ay), (bx, by) = P[0], P[-1]; dx, dy = bx - ax, by - ay; L = (dx * dx + dy * dy) ** .5 or 1e-12
    dmax, idx = 0, 0
    for i in range(1, len(P) - 1):
        d = abs(dy * P[i][0] - dx * P[i][1] + bx * ay - by * ax) / L
        if d > dmax: dmax, idx = d, i
    if dmax <= eps: return [P[0], P[-1]]
    return rdp(P[:idx + 1], eps)[:-1] + rdp(P[idx:], eps)

def rdp_ring(P, eps):  # 封閉環：從離起點最遠的點切成兩半各自簡化（首尾同點時 rdp 的距離公式會退化）
    if len(P) < 4: return P
    far = max(range(len(P)), key=lambda i: (P[i][0] - P[0][0]) ** 2 + (P[i][1] - P[0][1]) ** 2)
    return rdp(P[:far + 1], eps)[:-1] + rdp(P[far:] + [P[0]], eps)

def r4(P): return [[round(x, 4), round(y, 4)] for x, y in P]

ap = argparse.ArgumentParser()
ap.add_argument('--bbox', required=True); ap.add_argument('--src', default='japan', choices=SRC)
ap.add_argument('--tol', type=float, default=0.0004); ap.add_argument('--rails', choices=['world'])
ap.add_argument('--write')
a = ap.parse_args()
b = [float(v) for v in a.bbox.split(',')]

land = []
for f in fetch(SRC[a.src])['features']:
    for ring in rings(f['geometry']):
        xs = [p[0] for p in ring]; ys = [p[1] for p in ring]
        if max(xs) < b[0] or min(xs) > b[2] or max(ys) < b[1] or min(ys) > b[3]: continue
        c = clip_poly(ring, b)
        if len(c) < 4: continue
        s = rdp_ring(c, a.tol)
        if len(s) >= 4: land.append(r4(s))
land.sort(key=len, reverse=True)
LAND = 'const LAND=' + json.dumps(land, separators=(',', ':')) + ';'
print('LAND：%d 個多邊形、%d 點、%.0f KB' % (len(land), sum(map(len, land)), len(LAND) / 1024), file=sys.stderr)

LINES = None
if a.rails:
    segs = []
    for f in fetch(RAILS)['features']:
        for ln in lines(f['geometry']):
            for s in clip_line(ln, b):
                s = rdp(s, a.tol / 2)
                if len(s) > 1: segs.append(r4(s))
    LINES = 'const LINES=' + json.dumps([{'n': '鐵道', 'c': '#7a7a7a', 's': segs}], ensure_ascii=False, separators=(',', ':')) + ';'
    print('LINES：%d 段、%.0f KB（沒有路線名，日本行程建議改用国土数値情報 N02）' % (len(segs), len(LINES) / 1024), file=sys.stderr)

if a.write:
    s = open(a.write, encoding='utf-8').read()
    s, n = re.subn(r'^const LAND=.*$', lambda m: LAND, s, count=1, flags=re.M); assert n == 1, '找不到 const LAND= 那一行'
    if LINES:
        s, n = re.subn(r'^const LINES=.*$', lambda m: LINES, s, count=1, flags=re.M); assert n == 1, '找不到 const LINES= 那一行'
    open(a.write, 'w', encoding='utf-8').write(s); print('✓ 已寫入', a.write, file=sys.stderr)
else:
    print(LAND)
    if LINES: print(LINES)

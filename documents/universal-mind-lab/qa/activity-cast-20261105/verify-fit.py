"""Check the jersey pattern and every baked version against the reviewed baseline."""
from pathlib import Path
import hashlib
import json
import struct
import subprocess

ASSETS = Path("lab/assets/festival")
BASE = "90e3c8e9d"
WIDTH = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}
TYPE = {5121: "B", 5123: "H", 5125: "I", 5126: "f"}


class GLB:
    def __init__(self, file, previous=False):
        data = subprocess.check_output(["git", "show", f"{BASE}:{file}"]) if previous else file.read_bytes()
        length = struct.unpack_from("<I", data, 12)[0]
        self.doc = json.loads(data[20 : 20 + length])
        self.bin = memoryview(data)[28 + length :]

    def stream(self, index):
        a = self.doc["accessors"][index]
        view = self.doc["bufferViews"][a["bufferView"]]
        fmt = "<" + TYPE[a["componentType"]] * WIDTH[a["type"]]
        start = view.get("byteOffset", 0) + a.get("byteOffset", 0)
        assert view.get("byteStride", struct.calcsize(fmt)) == struct.calcsize(fmt)
        return self.bin[start : start + a["count"] * struct.calcsize(fmt)], fmt

    def chest(self, material):
        for mesh in self.doc["meshes"]:
            for prim in mesh["primitives"]:
                if self.doc["materials"][prim["material"]]["name"] != material:
                    continue
                pts = list(struct.iter_unpack(self.stream(prim["attributes"]["POSITION"])[1],
                                              self.stream(prim["attributes"]["POSITION"])[0]))
                data, fmt = self.stream(prim["indices"])
                used = [pts[i] for (i,) in set(struct.iter_unpack(fmt, data))]
                top = max(y for x, y, z in used)
                mid = [z for x, y, z in used if abs(x) < .075 and top-.21 < y < top-.075]
                return max(mid)-min(mid)
        raise ValueError(f"Missing garment material {material}")

    def poses(self):
        result = {}
        for node in self.doc["nodes"]:
            prim = self.doc["meshes"][node["mesh"]]["primitives"][0]
            streams = [prim["attributes"]["POSITION"]] + [p["POSITION"] for p in prim["targets"]]
            result[node["extras"]["look"]] = [hashlib.sha256(self.stream(i)[0]).hexdigest() for i in streams]
        return result


for name in ["05", "09", "D1", "D2", "D3", "phone-09"]:
    f = ASSETS / (name + ".glb")
    actual = GLB(f)
    depth = actual.chest("Classic crew tee")
    assert .15 < depth < .29, (name, depth)
    if name != "phone-09":
        old = GLB(f, True).chest("Oversized tee")
        assert depth < .87 * old, (name, depth, old)
    if name.startswith("D"):
        assert any("In This World chest print" == m["name"] for m in actual.doc["materials"])
    print(f"{name}: shirt depth at centre chest {depth:.3f} m")

for pack, affected in {"walkers": {"09", "D2"}, "workshops": {"05", "09", "D3"},
                       "crowd": {"05", "09", "D1", "D2", "D3"}}.items():
    f = ASSETS / (pack + ".glb")
    old, new = GLB(f, True).poses(), GLB(f).poses()
    assert old.keys() == new.keys()
    changed = {k for k in new if old[k] != new[k]}
    assert changed == affected, (pack, changed)
    assert all(all(a != b for a, b in zip(old[k], new[k])) for k in changed)
    print(f"{pack}: checked every animation sample for {', '.join(sorted(changed))}")

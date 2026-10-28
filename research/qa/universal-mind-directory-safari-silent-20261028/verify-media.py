from pathlib import Path
import struct,hashlib,json

def inspect(path):
 data=Path(path).read_bytes()
 def boxes(start=0,end=None):
  end=len(data) if end is None else end
  while start+8<=end:
   size,kind=struct.unpack_from('>I4s',data,start);head=8
   if size==1:size=struct.unpack_from('>Q',data,start+8)[0];head=16
   if size==0:size=end-start
   assert size>=head and start+size<=end
   yield kind.decode(),start+head,start+size,start
   start+=size
 def child(box,kind): return next(b for b in boxes(box[1],box[2]) if b[0]==kind)
 top=list(boxes());moov=next(b for b in top if b[0]=='moov');tracks=[]
 for trak in boxes(moov[1],moov[2]):
  if trak[0]!='trak':continue
  mdia=child(trak,'mdia');hdlr=child(mdia,'hdlr');kind=data[hdlr[1]+8:hdlr[1]+12].decode()
  result={'kind':kind}
  if kind=='vide':
   stbl=child(child(mdia,'minf'),'stbl');stsz=child(stbl,'stsz');sample_size,count=struct.unpack_from('>II',data,stsz[1]+4)
   sizes=[sample_size]*count if sample_size else list(struct.unpack_from('>'+str(count)+'I',data,stsz[1]+12))
   entries=child(stbl,'stsc');n=struct.unpack_from('>I',data,entries[1]+4)[0]
   entries=[struct.unpack_from('>III',data,entries[1]+8+i*12) for i in range(n)]
   offsets=next(b for b in boxes(stbl[1],stbl[2]) if b[0] in ('stco','co64'));n=struct.unpack_from('>I',data,offsets[1]+4)[0]
   offsets=struct.unpack_from('>'+str(n)+('I' if offsets[0]=='stco' else 'Q'),data,offsets[1]+8)
   checksum=hashlib.sha256();sample=0;entry=0
   for i,offset in enumerate(offsets,1):
    while entry+1<len(entries) and entries[entry+1][0]<=i:entry+=1
    for _ in range(entries[entry][1]):
     length=sizes[sample];checksum.update(data[offset:offset+length]);sample+=1;offset+=length
   assert sample==count
   stsd=child(stbl,'stsd');codec=data[stsd[1]+12:stsd[1]+16].decode()
   result.update(codec=codec,sampleCount=count,compressedFramesSha256=checksum.hexdigest())
  tracks.append(result)
 return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'fastStart':moov[3]<next(b[3] for b in top if b[0]=='mdat'),'tracks':tracks}
a=inspect('/private/tmp/um-directory-20261028/repo/home/assets/festival-loop.mp4')
b=inspect('/private/tmp/um-directory-20261028/safari-silent-work/festival-loop-silent.mp4')
assert next(t for t in a['tracks'] if t['kind']=='vide')==next(t for t in b['tracks'] if t['kind']=='vide')
assert len(b['tracks'])==1 and b['tracks'][0]['kind']=='vide' and b['fastStart']
report={'original':a,'videoOnly':b,'compressedVideoIdentical':True,'audioRemoved':True}
Path('/private/tmp/um-directory-20261028/safari-silent-work/media-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))

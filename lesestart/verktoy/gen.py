# Lager alle lydklipp for Lesestart med Piper (no_NO-talesyntese-medium) -> lyd.json {nøkkel: base64 mp3}
import numpy as np, wave, json, base64, subprocess, os
from piper import PiperVoice
from piper.config import SynthesisConfig
v=PiperVoice.load('no.onnx')
def trim(a):
  a=np.asarray(a,dtype=np.float32); th=0.02*np.abs(a).max(); i=np.where(np.abs(a)>th)[0]
  return a[max(0,i[0]-200):i[-1]+600]
def mp3(a,key):
  a=a/np.abs(a).max()*0.89
  pad=np.zeros(int(22050*0.05),np.float32); a=np.concatenate([pad,a,pad])
  with wave.open('t.wav','wb') as w: w.setnchannels(1);w.setsampwidth(2);w.setframerate(22050);w.writeframes((a*32767).astype(np.int16).tobytes())
  subprocess.run(['ffmpeg','-y','-loglevel','error','-i','t.wav','-ac','1','-ar','22050','-b:a','40k','t.mp3'],check=True)
  out[key]=base64.b64encode(open('t.mp3','rb').read()).decode()
def text(t,L=1.0):
  ch=list(v.synthesize(t,SynthesisConfig(length_scale=L)))
  return trim(np.concatenate([c.audio_float_array for c in ch]))
out={}
S={'i':(['ˈ','i','ː'],2),'s':(['s','ː'],2),'o':(['ˈ','u','ː'],2),'l':(['ˈ','l','ː'],2.4),'e':(['ˈ','e','ː'],2),'v':(['ˈ','v','ː'],2),'a':(['ˈ','ɑ','ː'],2),'t':(['t','ʰ'],1)}
for k,(p,L) in S.items(): mp3(trim(v.phoneme_ids_to_audio(v.phonemes_to_ids(p),SynthesisConfig(length_scale=L))),'L_'+k)
W=json.load(open('ord.json'))
for w in W: mp3(text(w+'.'),'W_'+w); mp3(text(w+'.',2.6),'S_'+w)
P=json.load(open('fraser.json'))
for k,t in P.items(): mp3(text(t,1.05),k)
json.dump(out,open('lyd.json','w'))
print(len(out),'klipp',sum(len(x) for x in out.values())//1024,'KB')

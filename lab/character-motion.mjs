// Layer a gesture on the authored clip. Working on rotation keys leaves the
// seated hips, shoes, clothing, helmet and headset attached to the original rig.
export function characterClip(THREE, original, activity, variant) {
  const clip = original.clone();
  const base = new THREE.Quaternion(), delta = new THREE.Quaternion(), angles = new THREE.Euler();
  const dancing = activity === 'dance', leading = activity === 'lead';
  const side = variant % 2 ? 'Right' : 'Left';
  for (const track of clip.tracks) {
    const bone = track.name.split('.')[0];
    if (!track.name.endsWith('.quaternion') || !['Head','Spine1','LeftArm','RightArm','LeftForeArm','RightForeArm'].includes(bone)) continue;
    const leadArm = bone.startsWith(side);
    for (let i=0; i<track.times.length; i++) {
      const a = track.times[i] / clip.duration * Math.PI * 2;
      const beat = Math.sin(a + variant * .83), turn = Math.cos(a + variant * .53);
      const gesture = (.5 + .5 * Math.sin(a - variant * .41)) ** 2;
      if (bone === 'Head') angles.set((dancing ? .11 : .07)*beat, (leading ? .28 : .19)*turn, .028*beat);
      else if (bone === 'Spine1') angles.set(.035*beat, (dancing ? .18 : .085)*turn, (dancing ? .13 : .025)*beat);
      else if (bone.endsWith('ForeArm')) angles.set(-(dancing ? .63 : leadArm ? (leading ? .60 : .32) : .09)*gesture, .045*turn, .035*beat);
      else angles.set(-(dancing ? .44 : leadArm ? .21 : .09)*gesture, .055*turn, (bone.startsWith('Left') ? 1 : -1)*(dancing ? .32 : .08)*gesture);
      base.fromArray(track.values,4*i).multiply(delta.setFromEuler(angles)).normalize().toArray(track.values,4*i);
    }
  }
  return clip;
}

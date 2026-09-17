import { Box3, Vector3 } from 'three';

export function inspectIceberg(scene) {
  scene.updateMatrixWorld(true);
  const meshes = [];
  scene.traverse(object => { if (object.isMesh) meshes.push(object); });
  if (meshes.length !== 2 || !meshes.some(mesh => mesh.name === 'ice_above') || !meshes.some(mesh => mesh.name === 'ice_below')) throw new Error('Unexpected iceberg meshes');
  const above = new Box3().setFromObject(scene.getObjectByName('ice_above'));
  const below = new Box3().setFromObject(scene.getObjectByName('ice_below'));
  const tolerance = 0.08;
  if (Math.abs(above.min.y) > tolerance || Math.abs(below.max.y) > tolerance || Math.abs(above.max.y - 20) > tolerance || Math.abs(below.min.y + 80) > tolerance) throw new Error('Unexpected iceberg orientation or scale');
  const bounds = new Box3().setFromObject(scene);
  const size = bounds.getSize(new Vector3());
  if (Math.abs(size.x - 56.930) > tolerance || Math.abs(size.z - 47.359) > tolerance) throw new Error('Unexpected iceberg width');
  let triangles = 0;
  for (const mesh of meshes) triangles += (mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) / 3;
  if (triangles !== 3848) throw new Error('Unexpected Version B topology');
  return { bounds, report: { meshes: meshes.map(mesh => mesh.name).sort(), triangles, size: size.toArray(), waterlineGap: above.min.y - below.max.y } };
}

export function disposeModel(scene) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  scene.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : object.material ? [object.material] : []) {
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  textures.forEach(texture => texture.dispose());
  materials.forEach(material => material.dispose());
  geometries.forEach(geometry => geometry.dispose());
}

export function cameraDistance(size, aspect, fov = 42) {
  return Math.max(size.y / 2, size.x / (2 * Math.max(aspect, 0.1))) / Math.tan(fov * Math.PI / 360) * 1.18 + size.z / 2;
}

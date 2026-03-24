export function getLocalData(appId, key) {
  try {
    const raw = localStorage.getItem(`${appId}_${key}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('getLocalData error', e);
    return null;
  }
}

export function setLocalData(appId, key, data) {
  try {
    localStorage.setItem(`${appId}_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error('setLocalData error', e);
  }
}

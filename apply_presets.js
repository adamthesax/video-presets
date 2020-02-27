const fetch = require('node-fetch');
const fs = require('fs');
const util = require('util');

const readDir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

function getEnv() {
  return {
    namespace: process.env.NAMESPACE,
    providers: process.env.PROVIDERS.split(','),
    transcodingApi: process.env.TRANSCODING_API,
    pipelineApi: process.env.PIPELINE_API,
  }
}

async function getGroups() {
  const contents = await readDir('.');
  const ignoreThese = ['.git', 'node_modules'];
  const dirs = contents.reduce((acc, cur) => {
    const stat = fs.lstatSync(cur);
    if (stat.isDirectory() && !ignoreThese.includes(cur)) {
      acc.push(cur);
    }
    return acc;
  }, []);
  return dirs;
}

async function getPresetFiles(groupName) {
  const contents = await readDir(groupName);
  const fileNames = contents.reduce((acc, cur) => {
    if (cur.endsWith('.json')) {
      acc.push(cur);
    }
    return acc;
  }, []);
  return fileNames.map(fileName => `${groupName}/${fileName}`);
}

async function getPresetMaps(env) {
  const res = await fetch(`${env.transcodingApi}/presetmaps`);
  const parsed = await res.json();
  return parsed
}

async function deletePresetMap(presetName, env) {
  const deleteUrl = `${env.transcodingApi}/presets/${presetName}`;
  const options = {
    method: 'delete',
    headers: { 'Content-Type': 'application/json' },
  };
  try {
    const resp = await fetch(deleteUrl, options);
    const parsed = await resp.json();
    return parsed;
  } catch (err) {
    console.log(`problem deleting preset: ${presetName} -> ${err}`);
    return null;
  }
}

async function createPreset(preset, env) {
  const options = {
    method: 'post',
    body: JSON.stringify(preset),
    headers: { 'Content-Type': 'application/json' },
  };
  const postUrl = `${env.transcodingApi}/presets`;
  try {
    const resp = await fetch(postUrl, options);
    const parsed = await resp.json();
    return parsed;
  } catch (err) {
    console.log(`problem creating preset: ${preset.preset.name} -> ${err}`);
    return null;
  }
}

async function updatePreset(relativePath, env, activePresets) {
  const rawPreset = await readFile(relativePath);
  const preset = JSON.parse(rawPreset);
  preset.preset.name = `${preset.preset.name}_${env.namespace}`;
  preset.providers = env.providers;
  if (Object.keys(activePresets).includes(preset.preset.name)) {
    await deletePresetMap(preset.preset.name, env);
  }
  await createPreset(preset, env);
  return preset.preset.name;
}

async function updateGroup(groupDir, env, activePresets) {
  const paths = await getPresetFiles(groupDir);
  const presetPromises = paths.map(path => updatePreset(path, env, activePresets));
  const presetNames = await Promise.all(presetPromises);
  return presetNames;
}

async function updatePipeline(encodingProfiles, env) {
  const putUrl = `${env.pipelineApi}/encodingprofiles`;
  const options = {
    method: 'put',
    body: JSON.stringify(encodingProfiles),
    headers: { 'Content-Type': 'application/json' },
  };
  try {
    const resp = await fetch(putUrl, options);
    const parsed = await resp.json();
    return parsed;
  } catch (err) {
    console.log(`problem updating profiles.`);
    return null;
  }
}

async function applyPresets() {
  const activeEnv = getEnv();
  const activePresets = await getPresetMaps(activeEnv);
  const groupDirs = await getGroups();
  const groupPromises = groupDirs.map(groupDir => updateGroup(groupDir, activeEnv, activePresets));
  const groupNames = await Promise.all(groupPromises);
  const encodingProfiles = groupDirs.reduce((acc, cur, i) => {
    acc[cur] = groupNames[i];
    return acc;
  }, {});
  console.log(encodingProfiles);
  await updatePipeline(encodingProfiles, activeEnv);
  return encodingProfiles;
}

if (require.main === module) {
  applyPresets();
}

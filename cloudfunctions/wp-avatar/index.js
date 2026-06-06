// 云函数: wp-avatar — 2D 桌宠形象管理 + AI照片转卡通
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const https = require('https');
const http = require('http');

const REPLICATE_TOKEN = process.env.REPLICATE_TOKEN || '';

const BASE_TEMPLATES = {
  cat: [
    { breed: '英短', color: 'blue', resource: '' },
    { breed: '美短', color: 'silver', resource: '' },
    { breed: '橘猫', color: 'orange', resource: '' },
    { breed: '暹罗', color: 'cream', resource: '' }
  ],
  dog: [
    { breed: '金毛', color: 'golden', resource: '' },
    { breed: '柯基', color: 'tan', resource: '' },
    { breed: '柴犬', color: 'yellow', resource: '' },
    { breed: '泰迪', color: 'brown', resource: '' }
  ],
  rabbit: [{ breed: '垂耳兔', color: 'white', resource: '' }],
  other: [{ breed: '通用', color: 'default', resource: '' }]
};

function httpsRequest(url, options) {
  return new Promise(function (resolve, reject) {
    if (!options) options = {};
    var mod = url.startsWith('https') ? https : http;
    var req = mod.request(url, options, function (res) {
      var chunks = [];
      res.on('data', function (c) { chunks.push(c); });
      res.on('end', function () { resolve(Buffer.concat(chunks).toString('utf8')); });
    });
    req.on('error', reject);
    req.setTimeout(120000, function () { req.destroy(); reject(new Error('请求超时')); });
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function generateCartoonPet(photoUrl, species, breed) {
  var speciesText = 'pet';
  if (species === 'dog') speciesText = 'dog';
  else if (species === 'cat') speciesText = 'cat';

  var breedText = breed || '';
  var prompt = 'a cute ' + breedText + ' ' + speciesText + ' as cute cartoon pet avatar, flat 2D illustration style, simple clean outlines, solid flat colors, chibi kawaii style, soft pastel tones, white background, vector art, studio ghibli style character, no shading, minimal details';
  var negativePrompt = 'realistic, photorealistic, 3d render, complex background, text, watermark, signature, blurry, low quality, ugly, deformed';

  // 用 REST API 调用 replicate
  var body = JSON.stringify({
    version: 'c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316',
    input: {
      prompt: prompt,
      negative_prompt: negativePrompt,
      image: photoUrl,
      image_strength: 0.65,
      num_outputs: 1,
      guidance_scale: 7.5,
      num_inference_steps: 30
    }
  });

  var createRes = await httpsRequest('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': 'Token ' + REPLICATE_TOKEN,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    },
    body: body
  });

  var prediction = JSON.parse(createRes);
  if (prediction.error) throw new Error(prediction.error);

  var getUrl = prediction.urls && prediction.urls.get;
  if (!getUrl) {
    if (prediction.output) return prediction.output[0];
    throw new Error('Replicate 返回格式异常: ' + JSON.stringify(prediction));
  }

  // 轮询等待
  var attempts = 0;
  while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled' && attempts < 90) {
    await new Promise(function (r) { setTimeout(r, 2000); });
    var pollRes = await httpsRequest(getUrl, {
      headers: { 'Authorization': 'Token ' + REPLICATE_TOKEN }
    });
    prediction = JSON.parse(pollRes);
    if (prediction.status === 'succeeded') {
      if (Array.isArray(prediction.output)) return prediction.output[0];
      if (typeof prediction.output === 'string') return prediction.output;
      throw new Error('Replicate output 格式异常: ' + JSON.stringify(prediction.output));
    } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error('AI 生成失败: ' + (prediction.error || 'unknown'));
    }
    attempts++;
  }
  throw new Error('AI 生成超时');
}

exports.main = async function (event, context) {
  var action = event.action;
  var wxContext = cloud.getWXContext();
  var openid = wxContext.OPENID;

  var userResult = await db.collection('common_user').where({ openid: openid }).get();
  if (userResult.data.length === 0) return { code: -1, msg: '用户未注册' };
  var userId = userResult.data[0]._id;

  try {
    switch (action) {

      case 'photo2avatar': {
        var petId = event.petId;
        var photoFileID = event.photoFileID;
        var species = event.species;
        var breed = event.breed;
        if (!petId) return { code: -1, msg: '缺少 petId' };
        if (!photoFileID) return { code: -1, msg: '缺少 photoFileID' };

        var photoResult = await cloud.getTempFileURL({ fileList: [photoFileID] });
        var photoUrl = photoResult.fileList[0].tempFileURL;
        if (!photoUrl) return { code: -1, msg: '获取照片链接失败' };

        var cartoonUrl = await generateCartoonPet(photoUrl, species, breed);

        var cartoonBuffer = await new Promise(function (resolve, reject) {
          var get = cartoonUrl.startsWith('https') ? https.get : http.get;
          get(cartoonUrl, function (res) {
            var chunks = [];
            res.on('data', function (c) { chunks.push(c); });
            res.on('end', function () { resolve(Buffer.concat(chunks)); });
            res.on('error', reject);
          });
        });

        var cloudPath = 'avatars/ai_' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.png';
        var uploadResult = await cloud.uploadFile({ cloudPath: cloudPath, fileContent: cartoonBuffer });

        var result = await db.collection('wp_avatar').add({
          data: {
            pet_id: petId, user_id: userId,
            base_appearance: {
              species: species, breed: breed, color: 'ai-generated',
              resource: uploadResult.fileID, generated: true, generated_at: new Date()
            },
            current_outfit: {}, photo_src: photoFileID,
            created_at: new Date(), updated_at: new Date()
          }
        });

        return {
          code: 1,
          data: {
            avatarId: result._id,
            baseAppearance: { species: species, breed: breed, color: 'ai-generated', resource: uploadResult.fileID, generated: true },
            currentOutfit: {}
          }
        };
      }

      case 'createOrGet': {
        var petId = event.petId;
        var species = event.species;
        var breed = event.breed;
        var force = event.force;
        if (!petId) return { code: -1, msg: '缺少 petId' };

        if (force) {
          var oldAvatars = await db.collection('wp_avatar').where({ pet_id: petId }).get();
          for (var i = 0; i < oldAvatars.data.length; i++) {
            var oldRes = oldAvatars.data[i].base_appearance.resource;
            if (oldRes) {
              try { await cloud.deleteFile({ fileList: [oldRes] }); } catch (e) { console.log('delete old file fail:', e.message); }
            }
            await db.collection('wp_avatar').doc(oldAvatars.data[i]._id).remove();
          }
        } else {
          var existResult = await db.collection('wp_avatar').where({ pet_id: petId }).get();
          if (existResult.data.length > 0) {
            var avatar = existResult.data[0];
            return { code: 1, data: { avatarId: avatar._id, baseAppearance: avatar.base_appearance, currentOutfit: avatar.current_outfit || {} } };
          }
        }

        var templates = BASE_TEMPLATES[species] || BASE_TEMPLATES['other'];
        var template = templates[0];
        if (breed && templates.length > 1) {
          var found = templates.find(function (t) { return t.breed === breed; });
          if (found) template = found;
        }

        var result = await db.collection('wp_avatar').add({
          data: {
            pet_id: petId, user_id: userId,
            base_appearance: { species: species || 'other', breed: template.breed, color: template.color, resource: '', generated: false },
            current_outfit: {}, created_at: new Date(), updated_at: new Date()
          }
        });

        return { code: 1, data: { avatarId: result._id, baseAppearance: { species: species, breed: template.breed, color: template.color, resource: '', generated: false }, currentOutfit: {} } };
      }

      case 'getByPet': {
        var petId = event.petId;
        if (!petId) return { code: -1, msg: '缺少 petId' };
        var result = await db.collection('wp_avatar').where({ pet_id: petId }).get();
        if (result.data.length === 0) return { code: -1, msg: '未创建 2D 形象' };
        var a = result.data[0];
        return { code: 1, data: { avatarId: a._id, petId: a.pet_id, baseAppearance: a.base_appearance, currentOutfit: a.current_outfit || {} } };
      }

      case 'deleteByPet': {
        var petId = event.petId;
        if (!petId) return { code: -1, msg: '缺少 petId' };
        var result = await db.collection('wp_avatar').where({ pet_id: petId }).get();
        if (result.data.length === 0) return { code: 1, data: { message: 'nothing to delete' } };
        for (var i = 0; i < result.data.length; i++) {
          var rec = result.data[i];
          if (rec.base_appearance && rec.base_appearance.resource) {
            try { await cloud.deleteFile({ fileList: [rec.base_appearance.resource] }); } catch (e) { console.log('delete file fail:', e.message); }
          }
          await db.collection('wp_avatar').doc(rec._id).remove();
        }
        return { code: 1, data: { message: '已删除' } };
      }

      case 'updateOutfit': {
        var avatarId = event.avatarId;
        var outfit = event.outfit;
        if (!avatarId) return { code: -1, msg: '缺少 avatarId' };
        await db.collection('wp_avatar').doc(avatarId).update({ data: { current_outfit: outfit || {}, updated_at: new Date() } });
        return { code: 1, data: { success: true } };
      }

      default:
        return { code: 0, data: { message: 'wp-avatar — action 不支持' } };
    }
  } catch (err) {
    console.error('[wp-avatar] Error:', err);
    return { code: -1, msg: err.message };
  }
};

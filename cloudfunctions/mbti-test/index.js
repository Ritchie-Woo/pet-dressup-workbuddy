// 云函数: mbti-test — 宠物 MBTI 测试 + 标签生成
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 内置题库
const QUIZ = require('./quiz-data.json');

// 每维度 3 题的分档映射
function scoreLabel(code, total) {
  if (total >= 13) return { level: 'high', label: QUIZ?.scoring?.type_map?.[code]?.['15_13'] || {} };
  if (total >= 8) return { level: 'mid', label: QUIZ?.scoring?.type_map?.[code]?.['12_8'] || {} };
  return { level: 'low', label: QUIZ?.scoring?.type_map?.[code]?.['7_3'] || {} };
}

exports.main = async (event, context) => {
  const { action } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const users = db.collection('common_user');
  const u = await users.where({ openid }).get();
  if (u.data.length === 0) return { code: -1, msg: '用户未注册' };
  const userId = u.data[0]._id;

  try {
    switch (action) {
      case 'getQuiz': {
        const { species } = event;
        const questions = (QUIZ?.questions || []).map(q => ({
          id: q.id, dimension: q.dimension,
          text: species === 'cat' && q.cat ? q.cat : q.dog || q.dog,
          options: q.options
        }));
        return { code: 1, data: { questions, dimensions: QUIZ?.dimensions || [], disclaimer: QUIZ?.disclaimer } };
      }

      case 'submit': {
        const { petId, answers } = event;
        if (!petId || !answers) return { code: -1, msg: '缺少 petId 或 answers' };

        // 验证 pet 归属
        const petResult = await db.collection('common_pet').doc(petId).get();
        if (!petResult.data || !petResult.data._id) return { code: -1, msg: '宠物不存在' };
        if (petResult.data.user_id !== userId) return { code: -2, msg: '无权操作' };

        // 计算各维度得分
        const dimensions = ['social', 'explore', 'react', 'rhythm'];
        const scores = {};
        for (const dim of dimensions) {
          const dimAnswers = answers.filter(a => a.dimension === dim);
          const total = dimAnswers.reduce((sum, a) => sum + (a.weight || 1), 0);
          scores[dim] = { total, ...scoreLabel(dim, total) };
        }

        // 生成四字母类型码
        const typeCode = dimensions.map(d => scores[d].label.code || '?').join('');
        const typeName = dimensions.map(d => scores[d].label.name || '').join(' · ');
        const typeDesc = dimensions.map(d => `${QUIZ?.dimensions?.find(di => di.code === d)?.label?.split(' ')[0] || d}：${scores[d].label.desc || ''}`);
        // 标签描述
        const labels = dimensions.map(d => ({ dimension: d, ...scores[d].label }));

        // 保存测试记录
        const testResult = await db.collection('mbti_test').add({
          data: {
            pet_id: petId, user_id: userId,
            e_score: scores.social.total, i_score: 0,
            s_score: scores.explore.total, n_score: 0,
            t_score: scores.react.total, f_score: 0,
            j_score: scores.rhythm.total, p_score: 0,
            result_type: typeCode,
            answers: answers.map(a => ({ questionId: a.id, choice: a.key, weight: a.weight })),
            created_at: new Date()
          }
        });

        // 更新/创建标签
        const existLabel = await db.collection('mbti_label').where({ pet_id: petId }).get();
        if (existLabel.data.length > 0) {
          await db.collection('mbti_label').doc(existLabel.data[0]._id).update({
            data: { type_code: typeCode, type_name: typeName, last_test_id: testResult._id, updated_at: new Date() }
          });
        } else {
          await db.collection('mbti_label').add({
            data: { pet_id: petId, user_id: userId, type_code: typeCode, type_name: typeName, last_test_id: testResult._id, is_visible: 1, created_at: new Date(), updated_at: new Date() }
          });
        }

        // 获取宠物基础信息
        let petName = '';
        try { petName = petResult.data.name; } catch (e) { /* */ }

        return {
          code: 1,
          data: {
            petId, petName, typeCode, typeName, labels,
            scores: dimensions.map(d => ({ dimension: d, total: scores[d].total, level: scores[d].level, name: scores[d].label.name, desc: scores[d].label.desc })),
            testId: testResult._id
          }
        };
      }

      case 'getLabel': {
        const { petId } = event;
        if (!petId) return { code: -1, msg: '缺少 petId' };
        const result = await db.collection('mbti_label').where({ pet_id: petId }).get();
        if (result.data.length === 0) return { code: -1, msg: '未测试' };
        const l = result.data[0];

        // 获取标签详细信息
        const dims = ['social', 'explore', 'react', 'rhythm'];
        const labels = [];
        for (let i = 0; i < dims.length; i++) {
          const code = l.type_code[i];
          labels.push({ dimension: dims[i], code });
        }

        return {
          code: 1,
          data: {
            petId: l.pet_id, typeCode: l.type_code, typeName: l.type_name,
            labels, isVisible: !!l.is_visible, testId: l.last_test_id
          }
        };
      }

      default:
        return { code: 0, data: { message: 'mbti-test — action 不支持' } };
    }
  } catch (err) {
    console.error('[mbti-test] Error:', err);
    return { code: -1, msg: err.message };
  }
};

// mbti/test/index.js — MBTI 性格测试
const { request } = require('../../utils/request');
const storage = require('../../utils/storage');

Page({
  data: {
    step: 'intro', // intro | quiz
    questions: [], currentIndex: 0, currentQ: null,
    selectedAnswer: null, selectedWeight: 0,
    progress: 0, submitting: false,
    answers: [] // [{id, dimension, key, weight}]
  },

  async startQuiz() {
    // 检查当前穿搭宠物
    const petInfo = storage.getSync('currentDressPet');
    if (!petInfo) {
      wx.showToast({ title: '请先在穿搭中选择宠物', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '加载题库…' });
    try {
      // 获取宠物物种
      const petRes = await request('common-pet', { action: 'detail', petId: petInfo.petId });
      const species = petRes.data?.species || 'dog';

      // 加载题库（云函数）
      const res = await request('mbti-test', { action: 'getQuiz', species });
      if (res.code !== 1) throw new Error(res.msg);

      this.setData({
        questions: res.data.questions, currentIndex: 0,
        step: 'quiz', answers: [], selectedAnswer: null,
        petId: petInfo.petId, petName: petInfo.petName, species
      });
      this.loadQuestion(0);
    } catch (err) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  loadQuestion(index) {
    const q = this.data.questions[index];
    // 恢复之前的选择
    const prev = this.data.answers.find(a => a.id === q.id);
    this.setData({
      currentQ: q, currentIndex: index,
      selectedAnswer: prev ? prev.key : null,
      selectedWeight: prev ? prev.weight : 0,
      progress: Math.round(((index) / this.data.questions.length) * 100)
    });
  },

  selectAnswer(e) {
    const { key, weight } = e.currentTarget.dataset;
    this.setData({ selectedAnswer: key, selectedWeight: parseInt(weight) });
  },

  nextQuestion() {
    if (!this.data.selectedAnswer) return;
    this.saveAnswer();
    const next = this.data.currentIndex + 1;
    this.loadQuestion(next);
  },

  prevQuestion() {
    this.saveAnswer();
    const prev = this.data.currentIndex - 1;
    this.loadQuestion(prev);
  },

  saveAnswer() {
    const q = this.data.currentQ;
    if (!q || !this.data.selectedAnswer) return;
    const answers = [...this.data.answers];
    const idx = answers.findIndex(a => a.id === q.id);
    const entry = { id: q.id, dimension: q.dimension, key: this.data.selectedAnswer, weight: this.data.selectedWeight };
    if (idx >= 0) answers[idx] = entry;
    else answers.push(entry);
    this.setData({ answers });
  },

  async submitQuiz() {
    this.saveAnswer();
    if (this.data.answers.length < this.data.questions.length) {
      wx.showToast({ title: '请回答所有题目', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      const res = await request('mbti-test', {
        action: 'submit',
        petId: this.data.petId,
        answers: this.data.answers
      });

      // 缓存结果
      storage.setSync('mbtiResult', res.data);
      wx.redirectTo({ url: '/mbti/card/index?testId=' + res.data.testId });
    } catch (err) {
      wx.showToast({ title: err.message || '提交失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});

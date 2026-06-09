// components/pay-sheet/index.js
Component({
  properties: {
    visible: { type: Boolean, value: false },
    amount: { type: String, value: '0.00' },
    title: { type: String, value: '' }
  },

  methods: {
    close() {
      this.triggerEvent('close');
    },
    confirm() {
      this.triggerEvent('confirm');
    }
  }
});

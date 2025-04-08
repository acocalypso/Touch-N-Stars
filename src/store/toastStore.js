import { defineStore } from 'pinia';

export const useToastStore = defineStore('toastStore', {
  state: () => ({
    newMessage: false,
    title: '',
    message: '',
    link: '',
    linkText: '',
    type: 'info',
  }),
  actions: {
    showToast({ type = 'info', title = '', message = '', link = '', linkText = '' }) {
      this.newMessage = true;
      this.type = type;
      this.title = title;
      this.message = message;
      this.link = link;
      this.linkText = linkText;
    },
  },
});

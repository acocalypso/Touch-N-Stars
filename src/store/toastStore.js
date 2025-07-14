import { defineStore } from 'pinia';

export const useToastStore = defineStore('toastStore', {
  state: () => ({
    newMessage: false,
    title: '',
    message: '',
    link: '',
    linkText: '',
    type: 'info',
    // Neue Confirmation-Properties
    isConfirmation: false,
    confirmationResolver: null,
    confirmText: 'Bestätigen',
    cancelText: 'Abbrechen',
  }),
  actions: {
    showToast({ type = 'info', title = '', message = '', link = '', linkText = '' }) {
      this.newMessage = true;
      this.type = type;
      this.title = title;
      this.message = message;
      this.link = link;
      this.linkText = linkText;
      this.isConfirmation = false;
    },

    // Neue Confirmation-Methode
    showConfirmation(confirmationTitle, confirmationMessage, confirmButtonText = 'Bestätigen', cancelButtonText = 'Abbrechen') {
      return new Promise((resolve) => {
        this.title = confirmationTitle;
        this.message = confirmationMessage;
        this.type = 'warning';
        this.confirmText = confirmButtonText;
        this.cancelText = cancelButtonText;
        this.isConfirmation = true;
        this.confirmationResolver = resolve;
        this.newMessage = true;
      });
    },

    confirmAction() {
      this.newMessage = false;
      this.isConfirmation = false;
      if (this.confirmationResolver) {
        this.confirmationResolver(true);
        this.confirmationResolver = null;
      }
    },

    cancelAction() {
      this.newMessage = false;
      this.isConfirmation = false;
      if (this.confirmationResolver) {
        this.confirmationResolver(false);
        this.confirmationResolver = null;
      }
    },

    closeToast() {
      if (this.isConfirmation) {
        this.cancelAction();
      } else {
        this.newMessage = false;
      }
    }
  },
});
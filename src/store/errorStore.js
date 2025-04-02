import { defineStore } from 'pinia';

export const useErrorStore = defineStore('errorStore', {
  state: () => ({
    isError: false,
    errorTitle: '',
    errorMessage: '',
    errorLink: '' ,
    errorLinkText: '' ,
  }),
  actions: {},
});

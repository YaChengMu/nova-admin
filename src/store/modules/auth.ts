import { defineStore } from 'pinia';
import { fetchLogin } from '@/service';
import { setUserInfo, getUserInfo, getToken, setToken, clearAuthStorage } from '@/utils/auth';
import { router } from '@/router';
import { useERouter } from '@/hook';
import { unref } from 'vue';

// const { routerPush, routerReplace } = useERouter(false);

export const useAuthStore = defineStore('auth-store', {
  state: () => {
    return {
      userInfo: getUserInfo(),
      token: getToken(),
      loginLoading: false,
    };
  },
  getters: {
    /** 是否登录 */
    isLogin(state) {
      return Boolean(state.token);
    },
  },
  actions: {
    /* 登录退出，重置用户信息等 */
    resetAuthStore() {
      const route = unref(router.currentRoute);
      const { toLogin } = useERouter(false);
      // 清除本地缓存
      clearAuthStorage();
      // 清空pinia
      this.$reset();
      if (route.meta.requiresAuth) {
        toLogin();
      }
    },

    /* 用户登录 */
    async login(userName: string, password: string) {
      this.loginLoading = true;
      const { data } = await fetchLogin({ userName, password });

      // 处理登录信息
      await this.handleAfterLogin(data as any);

      this.loginLoading = false;
    },

    /* 登录后的处理函数 */
    async handleAfterLogin(data: Auth.UserInfo) {
      // 等待数据写入完成
      const catchSuccess = await this.catchUserInfo(data);

      // 登录写入信息成功
      if (catchSuccess) {
        // 进行重定向跳转
        const { toLoginRedirect } = useERouter(false);
        toLoginRedirect();

        // 触发用户提示
        window.$notification?.success({
          title: '登录成功!',
          content: `欢迎回来，${this.userInfo.realName}!`,
          duration: 3000,
        });
        return;
      }
      // 如果不成功写到后面
    },

    /* 缓存用户信息 */
    async catchUserInfo(data: Auth.UserInfo) {
      let catchSuccess = false;

      // 存储用户信息
      setUserInfo(data);
      setToken(data.token);
      this.userInfo = data;
      this.token = data.token;

      catchSuccess = true;

      return catchSuccess;
    },
  },
});

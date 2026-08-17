<template>
  <div class="login-page">
    <div class="login-page__bg" aria-hidden="true">
      <span class="login-page__orb login-page__orb--a" />
      <span class="login-page__orb login-page__orb--b" />
      <span class="login-page__grid" />
    </div>

    <div class="login-page__panel">
      <header class="login-page__brand">
        <img :src="websiteConfig.logo" alt="" class="login-page__logo" />
        <h1 class="login-page__title">{{ websiteConfig.title }}</h1>
        <p class="login-page__desc">{{ websiteConfig.loginDesc }}</p>
      </header>

      <n-form
        ref="loginFormRef"
        class="login-page__form"
        :model="form"
        size="large"
        :show-label="false"
        :show-require-mark="false"
        @keyup.enter="loginSubmit"
      >
        <n-form-item path="username" :rule="rules.username">
          <n-input
            v-model:value="form.username"
            placeholder="请输入账号"
            maxlength="64"
            clearable
            :input-props="{ autocomplete: 'username' }"
          >
            <template #prefix>
              <n-icon :component="PersonOutline" />
            </template>
          </n-input>
        </n-form-item>

        <n-form-item path="password" :rule="rules.password">
          <n-input
            v-model:value="form.password"
            type="password"
            placeholder="请输入密码"
            maxlength="64"
            show-password-on="click"
            :input-props="{ autocomplete: 'current-password' }"
          >
            <template #prefix>
              <n-icon :component="LockClosedOutline" />
            </template>
          </n-input>
        </n-form-item>

        <n-form-item path="code" :rule="rules.code">
          <div class="login-page__captcha">
            <n-input
              v-model:value="form.code"
              placeholder="请输入验证码"
              maxlength="8"
              :input-props="{ autocomplete: 'off' }"
            >
              <template #prefix>
                <n-icon :component="ShieldCheckmarkOutline" />
              </template>
            </n-input>
            <button
              type="button"
              class="login-page__captcha-btn"
              title="点击刷新验证码"
              @click="getCode"
            >
              <img v-if="codeUrl" :src="codeUrl" alt="验证码" />
              <span v-else>加载中</span>
            </button>
          </div>
        </n-form-item>

        <n-button
          type="primary"
          class="login-page__submit"
          block
          strong
          :loading="loading"
          @click="loginSubmit"
        >
          登录
        </n-button>
      </n-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * 登录密码 AES：密钥从环境变量读取，避免源码硬编码。
 * 兼容旧后端时在 .env.* 配置 VITE_LOGIN_AES_KEY / VITE_LOGIN_AES_IV（均为 16 字节）。
 * 客户端加密不能替代 HTTPS / 服务端认证。
 */
import {
  LockClosedOutline,
  PersonOutline,
  ShieldCheckmarkOutline,
} from '@vicons/ionicons5'
import type { FormInst, FormItemRule } from 'naive-ui'
import { websiteConfig } from '@/config/website.config'
import { aesEncryptCbcHex } from '@/utils/aes'

const AES_KEY = String(import.meta.env.VITE_LOGIN_AES_KEY || '')
const AES_IV = String(import.meta.env.VITE_LOGIN_AES_IV || '')

async function encryptPassword(word: string) {
  if (!AES_KEY || !AES_IV) {
    console.warn('[login] VITE_LOGIN_AES_KEY / VITE_LOGIN_AES_IV 未配置，将以明文提交密码（仅限本地调试）')
    return word
  }
  return aesEncryptCbcHex(word, AES_KEY, AES_IV)
}

/** 仅允许站内相对路径，防止 open redirect */
function resolveReturnUrl(raw?: string | null): string {
  if (!raw)
    return '/'
  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  }
  catch {
    return '/'
  }
  if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('://'))
    return '/'
  return decoded
}

const router = useRouter()
const route = useRoute()
const codeUrl = ref('')
const loginFormRef = ref<FormInst | null>(null)
const form = reactive({
  username: '',
  password: '',
  code: '',
  uuid: '',
})
const loading = ref(false)

const rules: Record<string, FormItemRule> = {
  username: { required: true, message: '请输入账号', trigger: ['blur', 'input'] },
  password: { required: true, message: '请输入密码', trigger: ['blur', 'input'] },
  code: { required: true, message: '请输入验证码', trigger: ['blur', 'input'] },
}

const getCode = () => {
  form.code = ''
  codeUrl.value = `${import.meta.env.VITE_baseUrl || '/api'}/ManageUser/createCodeImage?t=${Date.now()}`
}

const loginSubmit = async () => {
  if (loading.value)
    return
  loading.value = true
  try {
    await loginFormRef.value?.validate()
    const params = {
      username: form.username,
      password: await encryptPassword(form.password),
      code: form.code,
      uuid: form.uuid,
      name: form.username,
    }
    const res: any = await post('/ManageUser/login', params)
    const { code, data } = res
    if (code === 0) {
      local.token = data?.token != null ? data : { token: data }
      window.$message?.success('登录成功')
      router.replace(resolveReturnUrl(route.query?.returnUrl as string))
    }
    else {
      window.$message?.error(data?.message || res?.message || '登录失败，请重试')
      getCode()
    }
  }
  catch {
    getCode()
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  getCode()
})
</script>

<style lang="scss" scoped>
.login-page {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 24px;
  overflow: hidden;
  background: #07111f;
  color: #e8eef7;
}

.login-page__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.login-page__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.55;
  animation: login-orb 18s ease-in-out infinite alternate;
}

.login-page__orb--a {
  top: -12%;
  left: -8%;
  width: 52vw;
  height: 52vw;
  max-width: 520px;
  max-height: 520px;
  background: radial-gradient(circle, #1768ac 0%, transparent 70%);
}

.login-page__orb--b {
  right: -10%;
  bottom: -18%;
  width: 48vw;
  height: 48vw;
  max-width: 480px;
  max-height: 480px;
  background: radial-gradient(circle, #1c90dc 0%, transparent 70%);
  animation-delay: -6s;
  animation-duration: 22s;
}

.login-page__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 45%, #000 20%, transparent 75%);
}

.login-page__panel {
  position: relative;
  z-index: 1;
  width: min(100%, 420px);
  padding: 40px 36px 36px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  background: rgba(12, 22, 40, 0.72);
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(18px);
  animation: login-panel-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.login-page__brand {
  margin-bottom: 28px;
  text-align: center;
}

.login-page__logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
  margin-bottom: 14px;
  animation: login-logo-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.login-page__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #f5f8fc;
  line-height: 1.3;
}

.login-page__desc {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(232, 238, 247, 0.62);
}

.login-page__form {
  :deep(.n-form-item) {
    margin-bottom: 18px;
  }

  :deep(.n-input) {
    --n-border-radius: 10px !important;
    --n-color: rgba(255, 255, 255, 0.06) !important;
    --n-color-focus: rgba(255, 255, 255, 0.09) !important;
    --n-border: 1px solid rgba(255, 255, 255, 0.12) !important;
    --n-border-hover: 1px solid rgba(45, 140, 240, 0.55) !important;
    --n-border-focus: 1px solid #2d8cf0 !important;
    --n-text-color: #f5f8fc !important;
    --n-placeholder-color: rgba(232, 238, 247, 0.42) !important;
    --n-caret-color: #2d8cf0 !important;
    --n-icon-color: rgba(232, 238, 247, 0.55) !important;
  }

  :deep(.n-form-item-feedback-wrapper) {
    min-height: 18px;
  }
}

.login-page__captcha {
  display: flex;
  gap: 10px;
  width: 100%;
}

.login-page__captcha :deep(.n-input) {
  flex: 1;
}

.login-page__captcha-btn {
  flex: 0 0 112px;
  height: 40px;
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease;

  &:hover {
    border-color: rgba(45, 140, 240, 0.55);
    transform: translateY(-1px);
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  span {
    display: grid;
    place-items: center;
    height: 100%;
    font-size: 12px;
    color: rgba(232, 238, 247, 0.5);
  }
}

.login-page__submit {
  --n-height: 44px !important;
  --n-border-radius: 10px !important;
  margin-top: 6px;
  font-size: 15px;
  letter-spacing: 0.12em;
}

@keyframes login-panel-in {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes login-logo-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes login-orb {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    transform: translate3d(4%, 6%, 0) scale(1.08);
  }
}

@media (max-width: 480px) {
  .login-page {
    padding: 16px;
  }

  .login-page__panel {
    padding: 28px 20px 24px;
  }

  .login-page__title {
    font-size: 20px;
  }

  .login-page__captcha-btn {
    flex-basis: 96px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-page__orb,
  .login-page__panel,
  .login-page__logo {
    animation: none;
  }
}
</style>

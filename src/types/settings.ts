export interface AppSettings {
  propstream_email: string
  propstream_password: string
  propstream_token: string
  propstream_token_expires: string
  groq_api_key: string
  investor_name: string
  investor_phone: string
  investor_company: string
  groq_model: string
}

export type SettingKey = keyof AppSettings

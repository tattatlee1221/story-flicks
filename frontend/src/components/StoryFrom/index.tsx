import React, { useState, useEffect } from 'react';
import type { FormProps } from 'antd';
import { Button, Form, Input, Select, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { getVoiceList, getLLMProviders, generateVideo } from '../../services/index';
import { VOICE_LANGUAGES, VOICE_LANGUAGES_LABELS } from '../../constants';
import { getSelectVoiceList } from '../../utils/index';
import styles from './index.module.css';
import { useVideoStore } from '../../stores/index';

type FieldType = {
  text_llm_provider?: string;
  image_llm_provider?: string;
  text_llm_model?: string;
  image_llm_model?: string;
  resolution?: string;
  test_mode?: boolean;
  task_id?: string;
  segments: number;
  language?: Language;
  story_prompt?: string;
  image_style?: string;
  voice_name: string;
  voice_rate: number;
};

const App: React.FC = () => {
  const { setVideoUrl, videoUrl } = useVideoStore();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [allVoiceList, setAllVoiceList] = useState<string[]>([]);
  const [nowVoiceList, setNowVoiceList] = useState<string[]>([]);
  const [llmProviders, setLLMProviders] = useState<{ textLLMProviders: string[]; imageLLMProviders: string[] }>({
    textLLMProviders: [],
    imageLLMProviders: [],
  });

  useEffect(() => {
    getLLMProviders().then(res => {
      console.log('llmProviders', res);
      setLLMProviders(res);
    }).catch(err => {
      console.log(err);
    });
    getVoiceList({ area: VOICE_LANGUAGES }).then(res => {
      console.log('voiceList', res?.voices);
      if (res?.voices?.length > 0) {
        setAllVoiceList(res?.voices);
      }
    }).catch(err => {
      console.log(err);
    });
  }, []);

  useEffect(() => {
    if (llmProviders.textLLMProviders.length > 2 && llmProviders.imageLLMProviders.length > 1) {
      form.setFieldsValue({
        text_llm_provider: llmProviders.textLLMProviders[2],
        image_llm_provider: llmProviders.imageLLMProviders[1],
      });
    }
  }, [llmProviders.imageLLMProviders, llmProviders.textLLMProviders]);

  const onFinish: FormProps<FieldType>['onFinish'] = (values) => {
    console.log('Success:', values);
    message.loading('Generating Video, please wait...', 0);
    generateVideo(values)
      .then(res => {
        message.destroy();
        if (res?.success === false) {
          throw new Error(res?.message || 'Generate Video Failed');
        }
        console.log('generateVideo res', res);
        message.success('Generate Video Success');
        if (res?.data?.video_url) {
          setVideoUrl(res?.data?.video_url);
        }
      })
      .catch(err => {
        message.error('Generate Video Failed: ' + (err?.message || JSON.stringify(err)), 10);
        console.log('generateVideo err', err);
      });
  };

  const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', padding: '10px' }}>
      {videoUrl && (
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <video
            controls
            src={videoUrl}
            style={{ maxWidth: '100%', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          />
        </div>
      )}

      <div className={styles.formDiv} style={{ maxWidth: '100%', margin: '0 auto' }}>
        <Form
          form={form}
          name="basic"
          labelCol={{ xs: { span: 24 }, sm: { span: 8 } }} // 手機全寬，桌面 8 格
          wrapperCol={{ xs: { span: 24 }, sm: { span: 16 } }} // 手機全寬，桌面 16 格
          style={{ width: '100%', maxWidth: '600px' }}
          initialValues={{ remember: true, resolution: '1024*1024' }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item<FieldType>
            label={t('storyForm.txtLLMProvider')}
            name="text_llm_provider"
            rules={[{ required: true, message: t('storyForm.txtLLMProviderMissMsg') }]}
           initialValue="siliconflow"
           hidden={true}
          >
            <Input placeholder={t('storyForm.textLLMPlaceholder')} />
          </Form.Item>
          <Form.Item<FieldType>
            label={t('storyForm.imgLLMProvider')}
            name="image_llm_provider"
            rules={[{ required: true, message: t('storyForm.imgLLMProviderMissMsg') }]}
            initialValue="siliconflow"
            hidden={true}
          >
           <Input placeholder={t('storyForm.textLLMPlaceholder')} />
          </Form.Item>
          <Form.Item<FieldType>
            label={t('storyForm.txtLLMModel')}
            initialValue="Qwen/Qwen2.5-7B-Instruct"
            name="text_llm_model"
            rules={[{ required: true, message: t('storyForm.txtLLMModelMissMsg') }]}
            hidden={true}
          >
            <Input placeholder={t('storyForm.textLLMPlaceholder')} />
          </Form.Item>
          <Form.Item<FieldType>
            label={t('storyForm.imgLLMModel')}
            initialValue="Kwai-Kolors/Kolors"
            name="image_llm_model"
            rules={[{ required: true, message: t('storyForm.imgLLMModelMissMsg') }]}
            hidden={true}
          >
            <Input placeholder={t('storyForm.imageLLMPlaceholder')} />
          </Form.Item>
          <Form.Item<FieldType>
            label={t('storyForm.resolution')}
            name="resolution"
            rules={[{ required: true, message: t('storyForm.resolutionMissMsg') }]}
            hidden={true}
          >
            <Input placeholder={t('storyForm.resolutionPlaceholder')} />
          </Form.Item>
          {/* 語言選擇欄位 - 頂部對齊 */}
          <Form.Item<FieldType>
            label={t('storyForm.videoLanguage')}
            name="language"
            rules={[{ required: true, message: t('storyForm.videoLanguageMissMsg') }]}
          >
            <Select
              onChange={(value) => {
                let voiceList = getSelectVoiceList(value, allVoiceList);
                setNowVoiceList(voiceList);
                form.setFieldsValue({
                  voice_name: voiceList[0]?.replace('-Female', '').replace('-Male', ''),
                });
              }}
              style={{ width: '100%' }}
            >
              {VOICE_LANGUAGES_LABELS.map((language) => (
                <Select.Option key={language.value} value={language.value}>
                  {language.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item<FieldType>
            label={t('storyForm.voiceName')}
            name="voice_name"
            rules={[{ required: true, message: t('storyForm.voiceNameMissMsg') }]}
          >
            <Select style={{ width: '100%' }}>
              {nowVoiceList.map((voice) => (
                <Select.Option
                  key={voice}
                  value={voice.replace('-Female', '').replace('-Male', '')}
                >
                  {voice}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item<FieldType>
            label={t('storyForm.textPrompt')}
            name="story_prompt"
            rules={[{ required: true, message: t('storyForm.textPromptMissMsg') }]}
          >
            <Input.TextArea rows={4} placeholder={t('storyForm.storyPromptPlaceholder')} />
          </Form.Item>
          <Form.Item<FieldType>
            label={t('storyForm.segments')}
            name="segments"
            rules={[{ required: true, message: t('storyForm.segmentsMissMsg'), min: 1, max: 10 }]}
          >
            <Input type="number" min={1} max={8} placeholder="3" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            wrapperCol={{ xs: { span: 24, offset: 0 }, sm: { span: 16, offset: 8 } }}
          >
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              {t('storyForm.submit')}
            </Button>
          </Form.Item>
        </Form>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .ant-form-item {
            margin-bottom: 12px;
          }
          .ant-form-item-label {
            padding: 0;
            text-align: left;
            width: 100%; /* 確保標籤全寬 */
          }
          .ant-form-item-label > label {
            font-size: 14px;
          }
          .ant-input,
          .ant-select,
          .ant-input-number,
          .ant-btn {
            font-size: 14px;
            width: 100%; /* 確保輸入框全寬 */
          }
          .ant-form {
            padding: 10px;
          }
          .ant-form-item-control {
            width: 100%; /* 輸入框容器全寬 */
          }
          .ant-form-item-label {
            margin-bottom: 4px;
          }
          /* 確保頂部語言欄位一致 */
          .ant-form-item:first-child .ant-form-item-label {
            margin-top: 0;
          }
        }
        /* 桌面端微調 */
        @media (min-width: 769px) {
          .ant-form-item-label {
            text-align: right;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
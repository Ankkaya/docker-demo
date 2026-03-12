<template>
  <Editor
    :model-value="normalizedModelValue"
    :init="editorInit"
    @update:model-value="handleUpdate"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import { uploadFile } from '@/api/file';
import { resolveFileUrl } from '@/utils/file-url';
import { normalizeRichTextHtml } from '@/utils/rich-text';
import 'tinymce/tinymce';
import 'tinymce/icons/default';
import 'tinymce/models/dom';
import 'tinymce/themes/silver';
import 'tinymce/skins/ui/oxide/skin.min.css';
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/code';
import 'tinymce/plugins/image';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/table';

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const uploadEditorFile = async (file: File) => {
  const result = await uploadFile(file, 'editor/assets');
  return resolveFileUrl(result.url);
};

const props = defineProps<{
  modelValue?: string;
}>();

const normalizedModelValue = computed(() => normalizeRichTextHtml(props.modelValue));

const editorInit = computed(() => ({
  height: 420,
  menubar: false,
  branding: false,
  promotion: false,
  automatic_uploads: true,
  file_picker_types: 'image',
  plugins: 'advlist autolink lists link image code table',
  toolbar:
    'undo redo | blocks fontsize | bold italic underline strikethrough | forecolor backcolor | ' +
    'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | ' +
    'link image table | removeformat code',
  font_size_formats: '12px 14px 16px 18px 20px 24px 28px 32px',
  content_style:
    'body { font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif; font-size: 14px; line-height: 1.7; padding: 12px; }',
  placeholder: '请输入商品详情',
  images_upload_handler: async (blobInfo: any) => {
    const file = blobInfo.blob() as File;
    return uploadEditorFile(file);
  },
  file_picker_callback: (callback: (url: string, meta?: Record<string, string>) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp,image/gif';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }

      try {
        const url = await uploadEditorFile(file);
        callback(url, { alt: file.name, title: file.name });
      } catch (error) {
        window.alert('文件上传失败');
      }
    };

    input.click();
  },
}));

const handleUpdate = (value: string) => {
  emit('update:modelValue', normalizeRichTextHtml(value));
};
</script>

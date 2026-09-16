import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useUploadInvoice } from '@/hooks/useInvoices';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';

type InvoiceType = 'PURCHASE' | 'SALES';

export default function UploadInvoiceScreen() {
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('PURCHASE');
  const [fileUri, setFileUri]         = useState<string | null>(null);
  const [fileName, setFileName]       = useState<string | null>(null);
  const [fileMime, setFileMime]       = useState<string>('image/jpeg');

  const { mutateAsync: upload, isPending } = useUploadInvoice();

  async function pickFromCamera() {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFileUri(asset.uri);
      setFileName(`invoice-${Date.now()}.jpg`);
      setFileMime('image/jpeg');
    }
  }

  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFileUri(asset.uri);
      setFileName(asset.fileName ?? `invoice-${Date.now()}.jpg`);
      setFileMime(asset.mimeType ?? 'image/jpeg');
    }
  }

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFileUri(asset.uri);
      setFileName(asset.name);
      setFileMime('application/pdf');
    }
  }

  async function handleUpload() {
    if (!fileUri || !fileName) {
      Alert.alert('تنبيه', 'يرجى اختيار ملف أولاً');
      return;
    }
    try {
      const form = new FormData();
      form.append('file', { uri: fileUri, name: fileName, type: fileMime } as any);
      form.append('invoiceType', invoiceType);
      const result = await upload(form);
      Alert.alert('تم الرفع', 'جاري تحليل الفاتورة بالذكاء الاصطناعي...', [
        { text: 'عرض الفاتورة', onPress: () => router.replace(`/(tabs)/invoices/${result.invoiceId}`) },
      ]);
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.light.bg }} contentContainerStyle={{ gap: 20, padding: 20 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 48 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: Colors.brand, fontSize: 16 }}>← رجوع</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.light.ink, flex: 1, textAlign: 'right' }}>رفع فاتورة</Text>
      </View>

      {/* Invoice type */}
      <View style={{ gap: 8 }}>
        <Text style={styles.label}>نوع الفاتورة</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {(['PURCHASE', 'SALES'] as const).map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setInvoiceType(t)}
              style={[styles.typeBtn, invoiceType === t && styles.typeBtnActive]}
            >
              <Text style={{ color: invoiceType === t ? '#fff' : Colors.light.ink2, fontWeight: '700', fontSize: 14 }}>
                {t === 'PURCHASE' ? '🛒 شراء' : '💰 مبيعات'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* File picker options */}
      <View style={{ gap: 10 }}>
        <Text style={styles.label}>اختر مصدر الفاتورة</Text>
        <TouchableOpacity style={styles.pickBtn} onPress={pickFromCamera}>
          <Text style={styles.pickIcon}>📷</Text>
          <Text style={styles.pickLabel}>التقاط صورة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pickBtn} onPress={pickFromGallery}>
          <Text style={styles.pickIcon}>🖼️</Text>
          <Text style={styles.pickLabel}>من مكتبة الصور</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pickBtn} onPress={pickDocument}>
          <Text style={styles.pickIcon}>📄</Text>
          <Text style={styles.pickLabel}>ملف PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Selected file indicator */}
      {fileName && (
        <View style={{ backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => { setFileUri(null); setFileName(null); }}>
            <Text style={{ color: Colors.danger, fontSize: 13 }}>حذف ✕</Text>
          </TouchableOpacity>
          <Text style={{ color: Colors.brand, fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' }} numberOfLines={1}>
            ✓ {fileName}
          </Text>
        </View>
      )}

      <Button label="رفع وتحليل بالذكاء الاصطناعي 🤖" onPress={handleUpload} loading={isPending} disabled={!fileUri} />

      <View style={{ backgroundColor: Colors.light.card, borderRadius: 12, padding: 14, gap: 6, borderWidth: 1.5, borderColor: Colors.light.border }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.light.ink, textAlign: 'right' }}>كيف يعمل؟</Text>
        <Text style={{ fontSize: 12, color: Colors.light.ink3, textAlign: 'right', lineHeight: 20 }}>
          {'الذكاء الاصطناعي يستخرج: اسم المورّد، التاريخ، المبلغ، الضريبة، وبنود الفاتورة تلقائياً — ثم يقترح القيد المحاسبي لمراجعتك وتأكيده.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label:       { fontSize: 13, fontWeight: '600', color: Colors.light.ink2, textAlign: 'right' },
  typeBtn:     { flex: 1, padding: 12, borderRadius: 10, backgroundColor: Colors.light.card, borderWidth: 1.5, borderColor: Colors.light.border, alignItems: 'center' },
  typeBtnActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  pickBtn:     { backgroundColor: Colors.light.card, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1.5, borderColor: Colors.light.border },
  pickIcon:    { fontSize: 24 },
  pickLabel:   { fontSize: 15, fontWeight: '600', color: Colors.light.ink },
});

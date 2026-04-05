import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import type { SupportTicket } from '@workigom/shared';

const CATEGORIES = [
    { label: 'Ödeme İşlemleri', value: 'payment' },
    { label: 'Takas / İlan Sorunları', value: 'swap' },
    { label: 'Hesap Ayarları', value: 'account' },
    { label: 'Performans & Hatalar', value: 'bug' },
    { label: 'Diğer', value: 'other' }
];

export default function SupportScreen({ navigation }: any) {
    const { profile } = useAuthStore();
    const [category, setCategory] = useState<SupportTicket['category']>('other');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!profile?.id) {
            Alert.alert('Hata', 'Oturum bilginiz bulunamadı.');
            return;
        }

        if (message.trim().length < 10) {
            Alert.alert('Uyarı', 'Lütfen sorununuzu daha açıklayıcı bir şekilde belirtin.');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase
                .from('support_tickets')
                .insert({
                    owner_id: profile.id,
                    category,
                    message,
                    status: 'open'
                });

            if (error) throw error;

            Alert.alert('Başarılı', 'Destek talebiniz başarıyla alındı. Ekibimiz en kısa sürede ilgilenecektir.', [
                { text: 'Tamam', onPress: () => navigation.goBack() }
            ]);
            
        } catch (error: any) {
            Alert.alert('Hata', 'Talebiniz iletilemedi: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#39ff14" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sorun Bildir</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Text style={styles.infoText}>
                    Yaşadığınız sorunu veya iletmek istediğiniz geri bildirimi aşağıdan detaylıca yazabilirsiniz.
                </Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Kategori</Text>
                    <View style={styles.categoryContainer}>
                        {CATEGORIES.map((c) => (
                            <TouchableOpacity 
                                key={c.value}
                                style={[styles.categoryBtn, category === c.value && styles.categoryBtnActive]}
                                onPress={() => setCategory(c.value as any)}
                            >
                                <Text style={[styles.categoryBtnText, category === c.value && styles.categoryBtnTextActive]}>
                                    {c.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Mesajınız</Text>
                    <TextInput
                        style={styles.textArea}
                        placeholder="Lütfen detayları belirtin..."
                        placeholderTextColor="#475569"
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#0a0b1e" />
                    ) : (
                        <>
                            <Send size={18} color="#0a0b1e" style={{ marginRight: 8 }} />
                            <Text style={styles.submitButtonText}>Talebi Gönder</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0b1e',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(57, 255, 20, 0.2)',
        backgroundColor: '#16172d',
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
    },
    infoText: {
        color: '#94a3b8',
        fontSize: 14,
        marginBottom: 24,
        lineHeight: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 8,
        letterSpacing: 1,
        paddingLeft: 4,
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryBtn: {
        backgroundColor: 'rgba(22, 23, 45, 0.8)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    categoryBtnActive: {
        borderColor: '#39ff14',
        backgroundColor: 'rgba(57, 255, 20, 0.1)',
    },
    categoryBtnText: {
        color: '#94a3b8',
        fontSize: 13,
        fontWeight: 'bold',
    },
    categoryBtnTextActive: {
        color: '#39ff14',
    },
    textArea: {
        backgroundColor: 'rgba(22, 23, 45, 0.8)',
        borderWidth: 1,
        borderColor: 'rgba(57, 255, 20, 0.3)',
        borderRadius: 12,
        color: '#fff',
        padding: 16,
        minHeight: 120,
        fontSize: 15,
    },
    submitButton: {
        backgroundColor: '#39ff14',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
        shadowColor: '#39ff14',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#0a0b1e',
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});

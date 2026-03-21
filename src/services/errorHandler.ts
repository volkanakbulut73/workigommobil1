import { Alert } from 'react-native';

export const ErrorHandler = {
  /**
   * Standardized API error handling.
   */
  handle(error: any, title = 'Hata') {
    console.error(`[${title}]:`, error);
    
    const message = error?.message || 'Bir şeyler ters gitti. Lütfen tekrar deneyin.';
    
    Alert.alert(title, message, [
      { text: 'Tamam', style: 'default' }
    ]);
  },

  /**
   * Error with retry option.
   */
  handleWithRetry(error: any, onRetry: () => void, title = 'Bağlantı Hatası') {
    Alert.alert(
      title,
      'İşlem gerçekleştirilemedi. Tekrar denemek ister misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Tekrar Dene', onPress: onRetry }
      ]
    );
  }
};

export const LoadingState = {
  // Global loading states can be added here if not using stores
};

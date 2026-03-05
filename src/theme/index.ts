export const theme = {
    colors: {
        background: '#F8F9FA', // Light greyish background
        surface: '#FFFFFF', // White cards
        primary: '#2D6A4F', // Core green
        primaryLight: '#D8F3DC', // Soft green background for chips/tags
        text: '#1B4332', // Dark green for main text
        textSecondary: '#6C757D', // Grey for secondary info
        border: '#E9ECEF', // Soft borders
        status: {
            healthy: '#34A853',
            thirsty: '#FA7A18',
            critical: '#D11A2A',
        },
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },
    borderRadius: {
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        round: 9999,
    },
    shadows: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
        },
        lg: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 8,
        },
    },
    typography: {
        fontFamily: {
            regular: 'Outfit_400Regular',
            medium: 'Outfit_500Medium',
            semiBold: 'Outfit_600SemiBold',
            bold: 'Outfit_700Bold',
        },
    },
};

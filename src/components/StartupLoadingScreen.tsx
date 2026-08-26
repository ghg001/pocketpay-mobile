import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Wallet, Shield, Sparkles } from 'lucide-react-native';
import { COLORS, SIZES, RADIUS } from '../constants/theme';

interface StartupLoadingScreenProps {
    /** Optional progress message to display */
    progressMessage?: string;
}

export const StartupLoadingScreen: React.FC<StartupLoadingScreenProps> = ({
                                                                              progressMessage = 'Preparing your wallet…',
                                                                          }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Pulse animation for the icon ring
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Rotation animation for the outer ring
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Animated outer ring */}
                <Animated.View
                    style={[
                        styles.outerRing,
                        {
                            transform: [{ rotate: rotateInterpolate }],
                        },
                    ]}
                >
                    <View style={styles.ringGradient} />
                </Animated.View>

                {/* Animated icon ring */}
                <Animated.View
                    style={[
                        styles.iconRing,
                        {
                            transform: [{ scale: pulseAnim }],
                        },
                    ]}
                >
                    <View style={styles.iconWrapper}>
                        <Wallet color={COLORS.primary} size={40} strokeWidth={1.5} />
                    </View>
                </Animated.View>

                {/* Decorative sparkles */}
                <View style={styles.sparkleContainer}>
                    <View style={[styles.sparkle, styles.sparkle1]}>
                        <Sparkles color="rgba(0, 229, 255, 0.3)" size={16} />
                    </View>
                    <View style={[styles.sparkle, styles.sparkle2]}>
                        <Sparkles color="rgba(123, 97, 255, 0.3)" size={12} />
                    </View>
                    <View style={[styles.sparkle, styles.sparkle3]}>
                        <Sparkles color="rgba(0, 230, 118, 0.25)" size={14} />
                    </View>
                </View>

                <Text style={styles.title}>PocketPay</Text>
                <Text style={styles.subtitle}>Non-custodial Stellar Wallet</Text>

                <View style={styles.loadingContainer}>
                    <View style={styles.loadingBar}>
                        <Animated.View
                            style={[
                                styles.loadingProgress,
                                {
                                    width: progressMessage.includes('Complete') || progressMessage === 'Ready' ? '100%' : '60%',
                                },
                            ]}
                        />
                    </View>
                    <Text style={styles.loadingText}>{progressMessage}</Text>
                </View>

                <View style={styles.securityBadge}>
                    <Shield color="rgba(0, 229, 255, 0.6)" size={14} />
                    <Text style={styles.securityText}>Encrypted • Self-custodial</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>PocketPay • Testnet</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SIZES.xl,
        paddingTop: SIZES.xxl * 2,
        paddingBottom: SIZES.xxl,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    outerRing: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 2,
        borderColor: 'rgba(0, 229, 255, 0.15)',
        borderStyle: 'dashed',
    },
    ringGradient: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: 80,
        borderWidth: 2,
        borderColor: 'rgba(0, 229, 255, 0.3)',
        borderStyle: 'dashed',
    },
    iconRing: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(0, 229, 255, 0.06)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(0, 229, 255, 0.2)',
        marginBottom: SIZES.xl,
    },
    iconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(0, 229, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sparkleContainer: {
        position: 'absolute',
        width: 200,
        height: 200,
        top: '50%',
        left: '50%',
        marginTop: -100,
        marginLeft: -100,
    },
    sparkle: {
        position: 'absolute',
    },
    sparkle1: {
        top: 10,
        right: 20,
    },
    sparkle2: {
        bottom: 30,
        left: 10,
    },
    sparkle3: {
        top: 50,
        left: -20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        letterSpacing: 0.5,
        marginBottom: SIZES.xs,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: SIZES.xl,
    },
    loadingContainer: {
        width: '100%',
        maxWidth: 280,
        alignItems: 'center',
    },
    loadingBar: {
        width: '100%',
        height: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: SIZES.sm,
    },
    loadingProgress: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
    loadingText: {
        color: COLORS.textSecondary,
        fontSize: 13,
        textAlign: 'center',
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: SIZES.xl,
        paddingHorizontal: SIZES.md,
        paddingVertical: SIZES.xs,
        borderRadius: 50, // Use numeric value instead of RADIUS.full
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    securityText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 11,
        fontWeight: '500',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    footer: {
        paddingBottom: SIZES.md,
    },
    footerText: {
        color: COLORS.textMuted,
        fontSize: 12,
        opacity: 0.3,
    },
});

export default StartupLoadingScreen;
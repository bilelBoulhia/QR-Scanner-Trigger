import {View, Text, TouchableOpacity, Platform, Animated, Button} from "react-native";
import * as WebBrowser from 'expo-web-browser';
import { StyleSheet } from "react-native";
import * as Google from 'expo-auth-session/providers/google';
import {useEffect} from "react";
import {LinearGradient} from "expo-linear-gradient";
import {Ionicons} from "@expo/vector-icons";
import {useToken} from "../context/authProvider";
import {router} from "expo-router";
const webClientId = '623858970830-s2tnvsvmo2jvo921mdpenpug5b3k07a6.apps.googleusercontent.com'
const androidClientId = '623858970830-2qloc0ubuusb7vd4jvhg0s0nbblfa19c.apps.googleusercontent.com'

WebBrowser.maybeCompleteAuthSession();



export default function  Page(){
    const config = {
        clientId: Platform.select({
            android: androidClientId,

            default: webClientId,
        }),
        scopes: [
            'https://www.googleapis.com/auth/drive.metadata.readonly',
            'https://www.googleapis.com/auth/drive',
        ],
    };

    const { setToken } = useToken();
    const [request,response,promptAsync] = Google.useAuthRequest(config)

    const handleToken =async () => {
        if (response?.type === "success") {
            const token = response.authentication?.accessToken;
            if (token) {
                setToken(token);
                router.push('/sheets');
                console.log("Token:", token);
            } else {
                console.error("Failed to retrieve the token");
            }
        } else {
            console.error("Authentication response type is not 'success'");
        }
    };


    const tempPushing= ()=>{
        router.push('/test');
    }


    const fadeAnim = new Animated.Value(0);
    const slideAnim = new Animated.Value(50);
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 10,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 4,
                tension: 10,
                useNativeDriver: true,
            }),
        ]).start();
        if (response) {
            handleToken();
        }
    }, [response]);


    return (
        <View style={{gap:25,flex:1,justifyContent:'center',alignItems:'center'}}>
            <View style={styles.textContainer}>
                <Ionicons name="qr-code-outline" size={80} color="#333" style={styles.icon} />
                <Text style={styles.bigText}>QR</Text>

            </View>
            <TouchableOpacity onPress={()=>promptAsync()} style={styles.button}>
                <LinearGradient
                    colors={['#60A5FA', '#818CF8', '#A78BFA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradient}
                >
                    <View style={styles.contentContainer}>

                        <Text style={styles.text}>Sign in with </Text>
                        <View>
                            <Ionicons name="logo-google" size={24} color="white" />
                        </View>
                    </View>
                </LinearGradient>

            </TouchableOpacity>


        </View>
    )
}



const styles = StyleSheet.create({

    textContainer: {
        display: 'flex',
        flexDirection: 'row',


        gap: 10,
    },

    icon: {

    },
    bigText: {
        fontFamily: 'Roboto',
        fontWeight: 'bold',
        fontSize: 72,
        color: '#333',
        letterSpacing: -2,
    },
    button: {
        borderRadius: 4,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

    },
    gradient: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',

        width:150,
        gap:10

    },

    text: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
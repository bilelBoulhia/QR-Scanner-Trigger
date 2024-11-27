import React, {useState, useEffect, useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert, Modal, TextInput} from 'react-native';
import {BarcodeScanningResult, Camera, CameraView} from 'expo-camera';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import {useRouter} from "expo-router";

const { width } = Dimensions.get('window');
const qrSize = width * 0.7;


export default function Page() {


    //const { id } = useLocalSearchParams();
    // const rootNavigationState = useRootNavigationState();
    // const {token} = useToken();
    // if (!rootNavigationState?.key ) return null;
    // else if(token === null) {
    //     return <Redirect href={'/'} />
    // }
    const [hasPermission, setHasPermission] = useState(null);
    const [Qrdata,setQrData]= useState<string>(null)
    const [fetchedNames, setFetchedNames] = useState<string[]>([]);
    const [enabledTorch, setEnabledTorch] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [range,setRange] = useState<string>('');
    const rangeRef = useRef()
    const router = useRouter();
    const handleExit =()=>{
        router.push('/sheets');
    }
    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    if (hasPermission === null) {
        return <Text>Requesting camera permission...</Text>;
    }
    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }


    const handleScanning = ({ data }: BarcodeScanningResult) => {
        setScanned(true);
        if (data) {
            setQrData(data);
            Alert.alert('Confirmed', `${data}`, [
                { text: 'OK', onPress: () => setScanned(false) }
            ]);
        }
    };

    //https://sheets.googleapis.com/v4/spreadsheets/1Vem_R2kzjTT6wp8-V9IUpw0tgi5OMDdgA7zX2R6HEUs/values/B2:B



    const fetchSpreadsheets = async (token:string ='ya29.a0AeDClZC4uaYzil8eLcdWFlaSMQGS_Y-JDW23qKUYrbIn_d8cPJNgmwto-rlq2ZCDETt3o8NL3hq8uL-6JBYczsawCetdanpwwVCDFmYNLL2phAPGtri89JGlkN1GW093w1eH44sZyM82vEABjCwF9I1hxG6k3IUNhKqUJ_c_aCgYKAXkSARMSFQHGX2MiCiBiBqWqMxFcwyF6lozVZA0175',id:string = '1Vem_R2kzjTT6wp8-V9IUpw0tgi5OMDdgA7zX2R6HEUs',range:string) => {


        try {
            const response = await fetch(
                'https://sheets.googleapis.com/v4/spreadsheets/' +id +'/' + 'values/' + range,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            const data = await response.json();
            setFetchedNames(data.values || []);
        } catch (err) {
            console.error("error");

        }
    };


    return (
        <View style={styles.container}>
            {range ? (
                <CameraView
                    style={styles.camera}
                    enableTorch={enabledTorch}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr"],
                    }}

                    onBarcodeScanned={scanned ? undefined : handleScanning}
                >
                    <LinearGradient
                        colors={['rgba(0,0,0,0.8)', 'transparent']}
                        style={styles.gradientTop}
                    />

                    <View style={styles.overlay}>
                        <View style={styles.scanArea}>
                            <View style={styles.cornerTL} />
                            <View style={styles.cornerTR} />
                            <View style={styles.cornerBL} />
                            <View style={styles.cornerBR} />
                        </View>

                    </View>

                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.gradientBottom}
                    >
                        <TouchableOpacity
                            onPress={() => setEnabledTorch(!enabledTorch)}
                            style={styles.iconButton}
                        >
                            <Ionicons name={enabledTorch ? "flashlight" : "flashlight-outline"} size={28} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleExit()}
                            style={styles.iconButton}
                        >


                            <Ionicons name="return-down-back-outline" size={28} color="white" />
                        </TouchableOpacity>
                    </LinearGradient>
                </CameraView>
            ) : (



                <Modal
                     transparent={false}
                     visible={true}
                     animationType="slide"

        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Enter a Range</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter range"

                        ref={rangeRef.current}



                    />
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => {
                                setRange(rangeRef.current);
                            }}
                        >
                            <Text style={styles.buttonText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
        width: "80%",
        padding: 20,
        backgroundColor: "white",
        borderRadius: 10,
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    input: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        padding: 10,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
    },
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanArea: {
        width: qrSize,
        height: qrSize,



        borderRadius: 20,
    },
    cornerTL: {
        position: 'absolute',
        top: -2,
        left: -2,
        width: 40,
        height: 40,
        borderColor: 'white',
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 20,
    },
    cornerTR: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 40,
        height: 40,
        borderColor: 'white',
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 20,
    },
    cornerBL: {
        position: 'absolute',
        bottom: -2,
        left: -2,
        width: 40,
        height: 40,
        borderColor: 'white',
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 20,
    },
    cornerBR: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 40,
        height: 40,
        borderColor: 'white',
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 20,
    },
    gradientTop: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 100,
    },
    gradientBottom: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 120,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    iconButton: {
        width: 60,
        height: 60,
        borderRadius: 30,

        justifyContent: 'center',
        alignItems: 'center',
    },
    instructions: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        position: 'absolute',
        bottom: 10,
        left: 20,
        right: 20,
    },
    button: {
        padding: 10,
        backgroundColor: "#007BFF",
        borderRadius: 5,
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
    },
});


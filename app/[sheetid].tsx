import {View, Text, Button} from "react-native";
import {Redirect, useRootNavigationState} from "expo-router";
import {useToken} from "../context/authProvider";
import {useEffect, useState} from "react";
import {Camera,  BarcodeScanningResult, CameraView} from 'expo-camera';
import {StyleSheet} from 'react-native';
export default function page(){


    //const { id } = useLocalSearchParams();
    const rootNavigationState = useRootNavigationState();
    const {token} = useToken();
    if (!rootNavigationState?.key ) return null;
    else if(token === null) {
        return <Redirect href={'/'} />
    }

    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [scanResult, setScanResult] = useState({
        bounds: null,
        cornerPoints: null,
        data: 'nothing',

    });
    useEffect(() => {
        const getPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };

        getPermissions().catch(r=>console.error(r.message));
    }, []);
    const handleBarcodeScanned = (result: BarcodeScanningResult) => {
        setScanned(true);
        setScanResult(result);
        alert(`${result.data}`);
    };
    if (hasPermission === null) {
        return <Text>permission is needed</Text>;
    }

    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }

    return(
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            >
                <View style={styles.overlay}>
                    <View style={styles.scanArea} />

                    <View style={styles.resultContainer}>
                        <Text style={styles.result}>{scanResult.data}</Text>
                    </View>
                    {scanned && (
                        <Button
                            title="retry"
                            onPress={() => {
                                setScanned(false);
                                setScanResult({
                                    bounds: null,
                                    cornerPoints: null,
                                    data: 'nothing',

                                });
                            }}
                        />
                    )}
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        width: 300,
        height: 300,
        borderWidth: 4,
        borderRadius:10,
        borderColor: 'white',
        backgroundColor: 'transparent',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 20,
    },
    resultContainer: {
        marginTop: 10,
        marginBottom: 20,
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 5,
    },
    result: {
        fontSize: 14,
        color: 'white',
        marginVertical: 2,
    },
});
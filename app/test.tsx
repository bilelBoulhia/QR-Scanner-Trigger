import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert, Modal, TextInput} from 'react-native';
import {BarcodeScanningResult, Camera, CameraView} from 'expo-camera';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import {Redirect, useLocalSearchParams, useRootNavigationState, useRouter} from "expo-router";
import {useToken} from "../context/authProvider";

const { width } = Dimensions.get('window');
const qrSize = width * 0.7;



function CheckIfExist(list:string[], target:string) {
    if(!list || !target) return null;
    for (let i = 0; i < list.length; i++) {
        if (target.trim() === list[i][1].trim()) {
            return list[i][0];
        }
    }
    return null;
}




export default function Page() {


    const { id } = useLocalSearchParams();
    const rootNavigationState = useRootNavigationState();
    const {token} = useToken();
    if (!rootNavigationState?.key ) return null;
    else if(token === null) {
        return <Redirect href={'/'} />
    }
    const [hasPermission, setHasPermission] = useState(null);

    const [fetchedNames, setFetchedNames] = useState<string[]>([]);
    const [enabledTorch, setEnabledTorch] = useState(false);
    const [modalvisible,setModalvisible] = useState(true);
    const [scanned, setScanned] = useState(false);
    const [range,setRange] = useState('B:C');

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

        const parsedData = data.match(/name:(.*?)(?:&|$)/)[1];
        let CheckingResult = CheckIfExist(fetchedNames, parsedData)
        if(CheckingResult){
            updateSpreadsheet(token,id,CheckingResult).catch(console.error);
        }else {
            CheckingResult  = 'user not found';
        }


        try {
            Alert.alert('Confirmed', `${CheckingResult}`, [
                { text: 'OK', onPress: () => setScanned(false) },
            ]);

        } catch (error) {
            Alert.alert('Error', error.message || "Failed to parse QR data", [
                { text: 'OK', onPress: () => setScanned(false) },
            ]);
        }
    };


    const fetchSpreadsheetInfo = async (token:string ,id:any,range:string) => {

        try {
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            const data = await response.json();
            if(response.status === 200){
                setFetchedNames(data.values);
                console.log(data.values);
            }else if(response.status === 400){
                Alert.alert('error','column is wrong make sure its in this order Letter + Number : Letter',[
                    { text: 'OK', onPress: () => setModalvisible(true) }
                ]);

            }else {
                Alert.alert('error','there was an error fetching data',[
                    { text: 'OK', onPress: () => setModalvisible(true) }
                ]);
            }


        } catch (err) {
            console.error("error",err);
        }
    };

    const handleSubmitRange = async () => {
        if (!range || range.trim() === '') {
            Alert.alert('Error', 'Please enter a valid range.');
            return;
        }
        setModalvisible(false);
        try {

            await  fetchSpreadsheetInfo(token,id,range).catch(err => console.log(err));
        } catch (err) {
            Alert.alert('Error', 'Failed to fetch spreadsheet data.')
        }

    };



    const updateSpreadsheet = async (token: string, id: any,range:string ) => {
        try {

            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/N${parseInt(range)+1}?valueInputOption=USER_ENTERED`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        range: `N${parseInt(range)+1}`,
                        values: [["user came"]],
                    }),
                }
            );

            if (response.ok) {
                Alert.alert('Success', 'Attendance marked', [
                    { text: 'OK', onPress: () => setScanned(false) },
                ]);

            } else {
                const errorData = await response.json();
                console.error('Failed to update spreadsheet:', errorData);
                Alert.alert('Error', 'Failed to update spreadsheet.', [
                    { text: 'OK', onPress: () => setScanned(false) },
                ]);
            }
        } catch (err) {
            console.error('Error updating spreadsheet:', err);
            Alert.alert('Error', 'An error occurred while updating the spreadsheet.', [
                { text: 'OK', onPress: () => setScanned(false) },
            ]);
        }
    };




    return (
        <View style={styles.container}>
            <Modal
                transparent={false}
                animationType="slide"
                visible={modalvisible}

            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>enter a range from the sheet</Text>
                        <TextInput
                            placeholder="eg. A1:A"
                            style={styles.input}
                            value={range}
                            onChangeText={(text) => setRange(text)}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.button}
                                onPress={() => {
                                    if (range && range.trim() !== '') {
                                        handleSubmitRange().catch(err => console.log(err));
                                    } else {
                                        Alert.alert('Error', 'Please a enter a valid range.');
                                    }
                                }}
                            >
                                <Text style={styles.buttonText}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <Text style={{color:'red',textAlign:'center'}}>{range?.toString()}</Text>


            {!modalvisible &&

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

            }




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


import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Alert,
    Modal,
    ActivityIndicator,
    TextInput
} from 'react-native';
import {BarcodeScanningResult, Camera, CameraView} from 'expo-camera';
import { Ionicons} from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import {Redirect, useLocalSearchParams, useRootNavigationState, useRouter} from "expo-router";
import {useToken} from "../context/authProvider";

import {Picker} from "@react-native-picker/picker";
const { width } = Dimensions.get('window');
const qrSize = width * 0.7;



function CheckIfExist(list:string[], target:string) {
    if(!list || !target) return null;
    try {
        for (let i = 0; i < list.length; i++) {
            if (target.trim() === list[i].toString().trim()) {
                return i+2;
            }
        }
        return null;
    }
    catch (error) {
        Alert.alert(error.message);

    }
}

 export default function Page() {
    const { id } = useLocalSearchParams();
    const {token} = useToken();
    const rootNavigationState = useRootNavigationState();
    if (!rootNavigationState?.key ) return null;
    else if(token === null) {
        return <Redirect href={'/'} />
    }




    const [hasPermission, setHasPermission] = useState(null);
    const [columnList,setColumnList] = useState<{label:string,value:string}[]>([]);
    const [fetchedNames, setFetchedNames] = useState<string[]>([]);
    const [enabledTorch, setEnabledTorch] = useState(false);
    const [modalvisible,setModalvisible] = useState(true);
    const [ToCompareTO, setToCompareTO] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [range,setRange] = useState(null);

    const router = useRouter();
    const handleExit =()=>{
        router.replace('/sheets');
    }

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');

        })();
        (async () => {
            const response = await fetch(
                    `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/1:1`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.status === 200) {
                    const data = await response.json();
                    const cols = data.values[0]?.map((c: string, i: number) => ({
                        label: c,
                        value: `${String.fromCharCode(97 + i)}2:${String.fromCharCode(97 + i)}`,
                    })) ;
                    setColumnList(cols);
                    console.log('cols', cols);
                } else {
                    Alert.alert('Error', 'Error fetching data');
                }
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
        const parsedData = data.match(`${ToCompareTO}:(\\w+)`)[1];
        let CheckingResult = CheckIfExist(fetchedNames, parsedData)

        if(CheckingResult){
            updateSpreadsheet(CheckingResult).catch(console.error);
        }else {
           Alert.alert('Not found', 'user not found', [
               { text: 'OK', onPress: () => setScanned(false) },
           ]);

        }
    };


    const fetchSpreadsheetInfo = async () => {

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
            }else {
                Alert.alert('error','there was an error fetching data',[
                    { text: 'OK', onPress: () => setModalvisible(true)}
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
            await fetchSpreadsheetInfo().catch(err => console.log(err));
        } catch (err) {
            Alert.alert('Error', 'Failed to fetch spreadsheet data.')
        }

    };


    const updateSpreadsheet = async (CheckingResult:number) => {
        try {
            // + 1  to avoid overwriting existing cells
            const columnRange = String.fromCharCode(96 + columnList.length + 1)
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${columnRange}${CheckingResult}?valueInputOption=USER_ENTERED`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        range: `${columnRange}${CheckingResult}`,
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
                Alert.alert('Error', 'Failed to update spreadsheet, make sure you have an empty column to write the values , and you are using one sheet in the spreadsheet.', [
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
                        <TouchableOpacity  style={styles.Exitbutton}  onPress={() => handleExit()}><Ionicons name={'backspace'} style={{color:'white'}}/></TouchableOpacity>
                        <Text style={styles.modalTitle}>select the column from the sheet</Text>

                        {columnList.length > 0 ? (
                            <Picker
                                selectedValue={range}
                                onValueChange={(itemValue) => setRange(itemValue)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select a column" value={null} />

                                {columnList.map((column, index) => (
                                    <Picker.Item
                                        key={index}
                                        label={column.label}
                                        value={column.value}
                                    />
                                ))}
                            </Picker>
                        ):(
                            <ActivityIndicator color='pruple'/>
                        )}

                        <View style={{width:'100%'}}>
                            <TextInput style={{borderRadius:0,padding:12,borderBottomColor:'gray',borderBottomWidth:2,marginTop:10,marginBottom:10 ,width:"100%"}} placeholder='compare it with..' onChange={(value) => setToCompareTO(value)} />
                            <Text style={{padding:10,color:'gray'}}>make sure the data you want scan in the qrcode is declare in this format value: (e.g.  name:NAMEHERE)</Text>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.button}
                                onPress={() => {
                                    if (range &&  ToCompareTO &&  range.trim()  !== '') {
                                        handleSubmitRange().catch(err => console.log(err));
                                    } else {
                                        Alert.alert('Error', 'Please a enter  valid data.');
                                    }
                                }}
                            >
                                <Text style={styles.buttonText}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
    picker: {
        width: '100%',
        height: 50,
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
    Exitbutton: {
        padding: 10,
        backgroundColor: "#6930a8",
        borderRadius: 5,
        alignSelf:'flex-end',
    },
    button: {
        padding: 10,
        backgroundColor: "#6930a8",
        borderRadius: 5,
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
    },
});


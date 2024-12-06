import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useToken } from "../context/authProvider";
import {Redirect,  useRootNavigationState, useRouter} from "expo-router";
import {LinearGradient} from "expo-linear-gradient";





const LoadingSpinner = () => {
    return (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="purple" />
        </View>
    )
}

const Retry = ({error ,fn}:{error:string,fn:Promise<void>})=>{
    return(
        <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fn}>
                <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
        </View>
    )
}

export default function Page() {


    //
    const {token, setToken} = useToken();
     if(token === null) {
        return <Redirect href={'/'} />
    }
    const [spreadsheets, setSpreadsheets] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (token) {
            fetchSpreadsheets(token).catch(error => console.error(error));
        } else {
            setIsLoading(false);
        }
    }, [token]);

    const fetchSpreadsheets = async (token:string) => {
        if (!token) {
            setError("Token is missing. Please authenticate first.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(
                'https://www.googleapis.com/drive/v3/files?' +
                new URLSearchParams({
                    q: "mimeType='application/vnd.google-apps.spreadsheet'",
                    fields: 'files(id,name)',
                    orderBy: 'modifiedTime desc',
                }).toString(),
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            const data = await response.json();
            setSpreadsheets(data.files || []);
            setIsLoading(false);
        } catch (err) {
            setError("Failed to fetch spreadsheets. Please try again.");
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        setToken(null);
        router.replace('/');
    };

    const router = useRouter();
    const handleRouting = (id:string) => {

        router.push({
            pathname: `/${id}`,
            params: { id:id }
        });
    }

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.item} onPress={()=> handleRouting(item.id)}>
            <Text style={styles.itemText}>{item.name}</Text>
        </TouchableOpacity>
    );
    const rootNavigationState = useRootNavigationState();
    switch (true) {
        case !rootNavigationState?.key:
            return null;

        case token == null:
            return <Redirect href={'/'}/>;

        case isLoading:
            return <LoadingSpinner/>;

        case !!error:
            return <Retry error={error} fn={fetchSpreadsheets(token)}/>;

        default:
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>Your Spreadsheets</Text>
                    {spreadsheets && spreadsheets.length > 0 ? (
                        <FlatList
                            data={spreadsheets}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                        />
                    ) : (
                        <Text style={styles.noSpreadsheetsText}>
                            {spreadsheets === null ? "Failed to load spreadsheets" : "No spreadsheets found"}
                        </Text>
                    )}

                    <View style={styles.logoutContainer}>
                        <TouchableOpacity onPress={handleLogout} style={styles.button}>
                            <LinearGradient
                                colors={['#60A5FA', '#818CF8', '#A78BFA']}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 0}}
                                style={styles.gradient}
                            >

                                <Text style={styles.text}>Log out </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                </View>
            );
    }
}

const styles = StyleSheet.create({
    logoutContainer:{

        position: "absolute",
        bottom: 0,
        left: '50%',
        transform: "translate(-50%, -50%)",
    },
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 20,
        flexDirection: 'column',

    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },

    text: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        alignSelf:'center'
    },
    gradient: {
        paddingVertical: 12,
        paddingHorizontal: 16,

    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    listContent: {
        paddingBottom: 20,
    },
    item: {
        backgroundColor: 'white',
        padding: 20,
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    itemText: {
        fontSize: 18,
        color: '#333',
    },
    button: {
        borderRadius: 4,
        overflow: 'hidden',
        elevation: 3,
        width:150,
        textAlign: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        alignSelf:'center'

    },
    logoutButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#333',
    },
    errorText: {
        fontSize: 16,
        color: '#ff0000',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 5,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
    },
    noSpreadsheetsText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    },
});


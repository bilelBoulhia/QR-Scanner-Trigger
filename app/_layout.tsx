import { Stack } from 'expo-router';
import {AuthProvider} from "../context/authProvider";


export default function Layout() {
    return (
        <AuthProvider>
            <Stack
            screenOptions={{
                headerShown: false,
            }}
            >
                <Stack.Screen name="index"  />
                <Stack.Screen name="sheets"  />
                <Stack.Screen name="test"  />
            </Stack>
        </AuthProvider>
    );
}
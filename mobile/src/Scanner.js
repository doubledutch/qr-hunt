import React, {PureComponent} from 'react'
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import QRCodeScanner from 'react-native-qrcode-scanner'
import client from '@doubledutch/rn-client'

export default class Scanner extends PureComponent {
  render() {
    const {onCancel, onScan} = this.props
    return (
      <View style={s.container}>
          { client._b.isEmulated
          ? <Text>No scanner in emulator</Text>
          : 
            <QRCodeScanner
              onRead={onScan}
              permissionDialogTitle="Camera Permission"
              permissionDialogMessage="Required to scan QR codes"
            />  
          }
        <TouchableOpacity style={s.button} onPress={onCancel}><Text style={s.buttonText}>CANCEL</Text></TouchableOpacity>
      </View>      
    )
  }
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 10,
  },
  button: {
    margin: 15,
    padding: 15,
    backgroundColor: client.primaryColor,
    borderRadius: 5,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
  },
})

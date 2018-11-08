/*
 * Copyright 2018 DoubleDutch, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, {PureComponent} from 'react'
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'
import QRCodeScanner from 'react-native-qrcode-scanner'
import client, { translate as t } from '@doubledutch/rn-client'

export default class Scanner extends PureComponent {
  render() {
    const {onCancel, onScan, primaryColor} = this.props
    return (
      <View style={s.container}>
          { client._b.isEmulated
          ? <Text>{t("noScanner")}</Text>
          : 
            <QRCodeScanner
              onRead={onScan}
              permissionDialogTitle={t("permission")}
              permissionDialogMessage={t("required")}
            />  
          }
        <TouchableOpacity style={[s.button, {backgroundColor: primaryColor}]} onPress={onCancel}><Text style={s.buttonText}>{t("cancel")}</Text></TouchableOpacity>
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
    borderRadius: 5,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
})

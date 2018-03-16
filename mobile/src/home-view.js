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

import React, { Component } from 'react'
import ReactNative, {Alert, ScrollView, Text, TouchableOpacity, View} from 'react-native'

import Checkmark from './Checkmark'
import Scanner from './Scanner'

import md5 from 'md5'
import client, { Avatar, TitleBar } from '@doubledutch/rn-client'
import FirebaseConnector from '@doubledutch/firebase-connector'
import firebase from 'firebase'
const fbc = FirebaseConnector(client, 'qrhunt')

fbc.initializeAppWithSimpleBackend()

const scansRef = () => fbc.database.private.adminableUserRef('scans')
const categoriesRef = () => fbc.database.public.adminRef('categories')
const codesRef = () => fbc.database.public.adminRef('codes')

console.disableYellowBox = true

export default class HomeView extends Component {
  constructor() {
    super()

    this.signin = fbc.signin()
      .then(user => this.user = user)
      .catch(err => console.error(err))
  }

  state = {scans: null, categories: [], codes: []}

  componentDidMount() {
    this.signin.then(() => {
      const wireListeners = () => {
        scansRef().on('value', data => this.setState({scans: data.val() || {}}))

        const onChildAdded = (stateProp, sort) => data => this.setState(state => ({[stateProp]: [...state[stateProp], {...data.val(), id: data.key}].sort(sort)}))
        const onChildChanged = (stateProp, sort) => data => this.setState(state => ({[stateProp]: [...state[stateProp].filter(x => x.id !== data.key), {...data.val(), id: data.key}].sort(sort)}))
        const onChildRemoved = stateProp => data => this.setState(state => ({[stateProp]: state[stateProp].filter(c => c.id !== data.key)}))
  
        categoriesRef().on('child_added', onChildAdded('categories', sortByName))
        categoriesRef().on('child_changed', onChildChanged('categories', sortByName))
        categoriesRef().on('child_removed', onChildRemoved('categories'))
  
        codesRef().on('child_added', onChildAdded('codes', sortByName))
        codesRef().on('child_changed', onChildChanged('codes', sortByName))
        codesRef().on('child_removed', onChildRemoved('codes'))  
      }

      fbc.database.private.adminableUserRef('adminToken').once('value', async data => {
        const longLivedToken = data.val()
        if (longLivedToken) {
          console.log('Attendee appears to be admin.  Logging out and logging in w/ admin token.')
          await firebase.auth().signOut()
          client.longLivedToken = longLivedToken
          await fbc.signinAdmin()
          console.log('Re-logged in as admin')
          this.setState({isAdmin: true})
        }
        wireListeners()
      })

    })
  }

  render() {
    const {categories, codes, isAdmin, onScan, scans, showScanner} = this.state
    const codesByCategory = codes.reduce((cbc, code) => {
      if (!cbc[code.categoryId]) cbc[code.categoryId] = {count: 0}
      const isScanned = scans[code.id]
      cbc[code.categoryId][code.id] = {...code, isScanned}
      if (isScanned) cbc[code.categoryId].count++
      return cbc
    }, {})

    return (
      <View style={s.container}>
        <TitleBar title="Challenge" client={client} signin={this.signin} />
        { showScanner
          ? <Scanner onScan={onScan} onCancel={this.cancelScan} />
          : <View style={s.container}>
              <ScrollView style={s.scroll}>
                { scans
                  ? categories.filter(cat => cat.scansRequired).map(cat => (
                    <View key={cat.id} style={s.categoryContainer}>
                      <Text style={s.category}>{cat.name}</Text>
                      { Object.values(codesByCategory[cat.id] || {}).filter(code => code.isScanned).sort(sortByName).map(code => (
                        <View key={code.id} style={s.scan}>
                          <View style={[s.circle, s.completeCircle]}>
                            <Checkmark size={circleSize * 0.6} />
                          </View>
                          <Text>{code.name}</Text>
                        </View>)
                      )}
                      { this.renderScanPlaceholders((codesByCategory[cat.id] || {}).count, cat.scansRequired) }
                    </View>
                  ))
                  : <Text>Loading...</Text>
                }
              </ScrollView>
              <View style={s.buttons}>
                <TouchableOpacity style={s.button} onPress={this.scanCode}><Text style={s.buttonText}>Scan Code</Text></TouchableOpacity>
                { isAdmin && <TouchableOpacity style={s.button} onPress={this.addCode}><Text style={s.buttonText}>Add Code (Admin)</Text></TouchableOpacity> }
              </View>
            </View>
        }        
      </View>
    )
  }

  renderScanPlaceholders(numScanned, numRequired) {
    const placeholders = []
    for (let i = numScanned || 0; i < numRequired; i++) {
      placeholders.push(<View key={i} style={s.scan}>
        <View style={[s.circle, s.placeholderCircle]} />
        <Text style={s.placeholderText}>Scan #{i+1}</Text>
      </View>)
    }
    return placeholders
  }

  scanCode = () => this.setState({
    showScanner: true,
    onScan: code => {
      const hash = md5(code.data)
      const namedCode = this.state.codes.find(c => c.id === hash)
      if (namedCode) {
        if (this.state.scans[hash]) {
          Alert.alert('Already scanned', 'It looks like you already scanned this QR code!')
        } else {
          scansRef().child(hash).set(true)
          Alert.alert('Congrats!', `You scanned ${namedCode.name}`)
        }
      } else {
        Alert.alert('Oops!', 'It looks like this QR code is not part of the challenge!')
      }
      this.setState({showScanner: false, onScan: null})
    }
  })
  addCode = () => this.setState({
    showScanner: true,
    onScan: code => {
      codesRef().child(md5(code.data)).set({value: code.data, name: 'Added @ ' + new Date().toString()})
      this.setState({showScanner: false, onScan: null})
    }
  })
  cancelScan = () => this.setState({showScanner: false, onScan: null})
}

function sortByName(a, b) {
  return (a.name || '').toLowerCase() < (b.name || '').toLowerCase() ? -1 : 1
}

const circleSize = 24
const green = '#61b53d'
const gray = '#a0a0a0'
const s = ReactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d9e1f9',
  },
  scroll: {
    flex: 1,
    padding: 15,
  },
  category: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 15,
  },
  categoryContainer: {
    marginBottom: 30,
  },
  scan: {
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    height: circleSize,
    width: circleSize,
    borderRadius: circleSize / 2,
    marginRight: 10,
  },
  completeCircle: {
    backgroundColor: green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderCircle: {
    borderColor: gray,
    borderWidth: 1,
  },
  placeholderText: {
    color: gray,
  },
  buttons: {
    flexDirection: 'row',
  },
  button: {
    margin: 15,
    padding: 15,
    backgroundColor: client.primaryColor,
    borderRadius: 5,
    flex: 1,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
  }
})

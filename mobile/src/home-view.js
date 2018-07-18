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
import Star from './Star'
import Scanner from './Scanner'
import md5 from 'md5'
import client, { Avatar, Color, TitleBar } from '@doubledutch/rn-client'
import FirebaseConnector from '@doubledutch/firebase-connector'
import firebase from 'firebase'
const fbc = FirebaseConnector(client, 'qrhunt')

fbc.initializeAppWithSimpleBackend()

const scansRef = () => fbc.database.private.adminableUserRef('scans')
const categoriesRef = () => fbc.database.public.adminRef('categories')
const codesRef = () => fbc.database.public.adminRef('codes')
const doneDescriptionRef = () => fbc.database.public.adminRef('doneDescription')
const welcomeRef = () => fbc.database.public.adminRef('welcome')
const titleRef = () => fbc.database.public.adminRef('title')

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
        doneDescriptionRef().on('value', data => this.setState({doneDescription: data.val()}))
        welcomeRef().on('value', data => this.setState({welcome: data.val()}))
        titleRef().on('value', data => this.setState({title: data.val()}))

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
    const {codes, isAdmin, onScan, scans, showScanner, title, doneDismissed, welcomeDismissed} = this.state
    const categories = this.state.categories.filter(c => c.name)
    const codesByCategory = codes.reduce((cbc, code) => {
      if (!cbc[code.categoryId]) cbc[code.categoryId] = {count: 0}
      const isScanned = scans[code.id]
      cbc[code.categoryId][code.id] = {...code, isScanned}
      if (isScanned) cbc[code.categoryId].count++
      return cbc
    }, {})
    let hasScannedRequiredInAllCategories = true
    const isDone = scans && !categories.find(cat =>
      (codesByCategory[cat.id] || {count:0}).count < cat.scansRequired)
    const anyScans = !!scans && !!Object.keys(scans).length
    const categoriesToShow = categories.filter(cat => cat.scansRequired <= this.findTotalCatCodes(cat, codesByCategory))
    return (
      <View style={s.container}>
        <TitleBar title={title || "Challenge"} client={client} signin={this.signin} />
        { !scans
          ? <Text>Loading...</Text>
          : !welcomeDismissed && !anyScans
            ? this.renderWelcome()
            : showScanner
              ? <Scanner onScan={onScan} onCancel={this.cancelScan} />
              : <View style={s.container}>
                  <ScrollView style={s.scroll}>
                    { categoriesToShow.map(cat => (
                        <View key={cat.id} style={s.categoryContainer}>
                          <View style={{flexDirection: "row"}}>
                            <Text style={s.category}>{cat.name}</Text>
                            <Text style={s.categoryRight}>{(codesByCategory[cat.id] || {}).count || 0} of {cat.scansRequired} complete </Text>
                          </View>
                          { Object.values(codesByCategory[cat.id] || {}).filter(code => code.isScanned).sort(sortByName).map(code => (
                            <View key={code.id} style={s.scan}>
                              <View style={[s.circle, s.completeCircle]}>
                                <Checkmark size={circleSize * 0.6} />
                              </View>
                              <Text style={s.codeTitle}>{code.name}</Text>
                            </View>)
                          )}
                          {this.renderScanPlaceholders((codesByCategory[cat.id] || {}).count, cat.scansRequired)}
                        </View>
                      ))
                    }
                    { categoriesToShow.length ? null : <View style={s.helpTextContainer}><Text style={s.helpText}>No categories have been added to begin the game.</Text></View> }
                  </ScrollView>
                  <View style={s.buttons}>
                    { categoriesToShow.length ? <TouchableOpacity style={s.button} onPress={this.scanCode}><Text style={s.buttonText}>Scan Code</Text></TouchableOpacity> : null }
                    { isAdmin && <TouchableOpacity style={s.button} onPress={this.addCode}><Text style={s.buttonText}>Add Code (Admin)</Text></TouchableOpacity> }
                  </View>
                </View>
        }
        { isDone && anyScans && !doneDismissed && this.renderDone() }
      </View>
    )
  }

  findTotalCatCodes = (cat, codesByCategory) => {
    const number = codesByCategory[cat.id] ? Object.keys(codesByCategory[cat.id]).length - 1 : 0
    return number
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

  renderWelcome() {
    return (
      <View style={s.container}>
        <View style={s.welcomeBox}>
          <Text style={s.welcomeTitle}>{this.state.title}</Text>
          <Text style={s.welcomeText}>{this.state.welcome}</Text>
          <View style={s.buttons}>
            <TouchableOpacity style={s.button} onPress={this.dismissWelcome}><Text style={s.buttonText}>LET&#39;S PLAY!</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  renderDone() {
    return (
      <TouchableOpacity style={s.done} onPress={this.dismissDone}>
        <Star style={s.star} />
        <Text style={s.doneTitle}>You did it!</Text>
        <Text style={s.doneDesc}>{this.state.doneDescription}</Text>
      </TouchableOpacity>
    )
  }

  scanCode = () => this.setState({
    showScanner: true,
    onScan: code => {
      const hash = md5(code.data)
      const namedCode = this.state.codes.find(c => c.id === hash)
      if (namedCode) {
        if (this.state.scans[hash]) {
          Alert.alert('Already scanned', 'It looks like you already scanned this QR code!', [{ text: 'OK', onPress: () => this.setState({showScanner: false, onScan: null}) }],
          { cancelable: false })
        } else {
          scansRef().child(hash).set(true)
          Alert.alert('Congrats!', `You scanned ${namedCode.name}`, [{ text: 'OK', onPress: () => this.setState({showScanner: false, onScan: null}) }],
          { cancelable: false })
        }
      } else {
        Alert.alert('Oops!', 'It looks like this QR code is not part of the challenge!', [{ text: 'OK', onPress: () => this.setState({showScanner: false, onScan: null}) }],
        { cancelable: false })
      }
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

  dismissWelcome = () => this.setState({welcomeDismissed: true})
  dismissDone = () => this.setState({doneDismissed: true})
}

function sortByName(a, b) {
  return (a.name || '').toLowerCase() < (b.name || '').toLowerCase() ? -1 : 1
}

const circleSize = 24
const green = '#61b53d'
const gray = '#a0a0a0'
const charcoal = '#364247'
const s = ReactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFEFEF',
  },
  scroll: {
    flex: 1,
    paddingVertical: 15
  },
  category: {
    fontSize: 14,
    textAlign: 'left',
    marginBottom: 10,
    marginTop: 15,
    color: charcoal,
    flex: 1
  },
  categoryRight: {
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 10,
    marginTop: 15,
    color: charcoal,
    flex: 1
  },
  categoryContainer: {
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10
  },
  scan: {
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpTextContainer: {
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center"
  },
  helpText: {
    fontSize: 20, 
    marginTop: 150, 
    textAlign: "center"
  },
  codeTitle: {
    fontSize: 18,
    color: charcoal
  },
  circle: {
    height: circleSize,
    width: circleSize,
    borderRadius: circleSize / 2,
    marginRight: 10,
  },
  completeCircle: {
    backgroundColor: client.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderCircle: {
    borderColor: client.primaryColor,
    borderWidth: 2,
  },
  placeholderText: {
    color: gray,
    fontSize: 18
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
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
  welcomeBox: {
    backgroundColor: "#FFFFFF",
    marginVertical: 10,
  },
  welcomeTitle: {
    color: charcoal,
    fontSize: 24,
    textAlign: 'center',
    marginTop: 20,
  },
  welcomeText: {
    color: charcoal,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 15
  },
  done: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneTitle: {
    fontSize: 24,
    color: '#fff',
    padding: 10,
    textAlign: 'center',
  },
  doneDesc: {
    fontSize: 16,
    color: '#fff',
    padding: 10,
    textAlign: 'center',
  },
  star: {
    height: 90,
    width: 90,
  },
})

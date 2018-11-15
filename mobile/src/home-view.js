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

import React, { PureComponent } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Checkmark from './Checkmark'
import Star from './Star'
import Scanner from './Scanner'
import md5 from 'md5'
import client, { TitleBar, translate as t, useStrings } from '@doubledutch/rn-client'
import {provideFirebaseConnectorToReactComponent} from '@doubledutch/firebase-connector'
import i18n from './i18n'
import firebase from 'firebase/app'

useStrings(i18n)

class HomeView extends PureComponent {
  scansRef = () => this.props.fbc.database.private.adminableUserRef('scans')
  categoriesRef = () => this.props.fbc.database.public.adminRef('categories')
  codesRef = () => this.props.fbc.database.public.adminRef('codes')
  doneDescriptionRef = () => this.props.fbc.database.public.adminRef('doneDescription')
  welcomeRef = () => this.props.fbc.database.public.adminRef('welcome')
  titleRef = () => this.props.fbc.database.public.adminRef('title')
  
  constructor(props) {
    super(props)

    this.signin = props.fbc.signin()
      .then(user => this.user = user)
      .catch(err => console.error(err))
  }

  state = {scans: null, categories: [], codes: [], done: false, primaryColor: null}

  componentDidMount() {
    const {fbc} = this.props
    client.getPrimaryColor().then(primaryColor => this.setState({primaryColor}))
    this.signin.then(() => {
      const wireListeners = () => {

        const onChildAdded = (stateProp, sort) => data => this.setState(state => ({[stateProp]: [...state[stateProp], {...data.val(), id: data.key}].sort(sort)}))
        const onChildChanged = (stateProp, sort) => data => this.setState(state => ({[stateProp]: [...state[stateProp].filter(x => x.id !== data.key), {...data.val(), id: data.key}].sort(sort)}))
        const onChildRemoved = stateProp => data => this.setState(state => ({[stateProp]: state[stateProp].filter(c => c.id !== data.key)}))

        this.categoriesRef().on('value', data => this.setState({
          categories: Object.entries(data.val() || {})
            .map(([id, val]) => ({...val, id}))
            .sort(sortByName)
        }))

        this.doneDescriptionRef().on('value', data => this.setState({doneDescription: data.val()}))
        this.welcomeRef().on('value', data => this.setState({welcome: data.val()}))
        this.titleRef().on('value', data => this.setState({title: data.val()}))

        this.scansRef().on('value', data => {this.setState({scans: data.val() || {}})})

        this.codesRef().on('child_added', onChildAdded('codes', sortByName))
        this.codesRef().on('child_changed', onChildChanged('codes', sortByName))
        this.codesRef().on('child_removed', onChildRemoved('codes'))  

        this.scansRef().on('value', data => {
          this.setState({scans: data.val() || {}, done: true})
        })
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
    const {codes, isAdmin, scans, showScanner, title, doneDismissed, welcomeDismissed, done, primaryColor} = this.state
    if (!primaryColor) return null

    const categories = this.state.categories.filter(c => c.name)
    const codesByCategory = codes.reduce((cbc, code) => {
      if (!cbc[code.categoryId]) cbc[code.categoryId] = {count: 0}
      const isScanned = scans[code.id]
      cbc[code.categoryId][code.id] = {...code, isScanned}
      if (isScanned) cbc[code.categoryId].count++
      return cbc
    }, {})

    const anyScans = !!scans && !!Object.keys(scans).length
    const isDone = anyScans && categories.length > 0 && !categories.find(cat =>
      (codesByCategory[cat.id] || {count:0}).count < cat.scansRequired)
    const categoriesToShow = categories.filter(cat => cat.scansRequired <= this.findTotalCatCodes(cat, codesByCategory) && cat.scansRequired > 0)
    return (
      <View style={s.container}>
        <TitleBar title={title || t("challenge")} client={client} signin={this.signin} />
        { scans === null && done === false
          ? <Text>{t("loading")}</Text>
          : !welcomeDismissed && !anyScans
            ? this.renderWelcome()
            : showScanner
              ? <Scanner onScan={this.onScan} onCancel={this.cancelScan} primaryColor={primaryColor} />
              : <View style={s.container}>
                  <ScrollView style={s.scroll}>
                    { categoriesToShow.map(cat => (
                        <View key={cat.id} style={s.categoryContainer}>
                          <View style={s.categoryHeader}>
                            <View style={{flexDirection: "row"}}>
                              <Text style={s.category}>{cat.name}</Text>
                              <Text style={s.categoryRight}>{t("complete", {current: (codesByCategory[cat.id] || {}).count || 0, total: cat.scansRequired})}</Text>
                            </View>
                            {cat.description ? <Text style={s.categoryDes}>{cat.description}</Text> : null}
                          </View>
                          { Object.values(codesByCategory[cat.id] || {}).filter(code => code.isScanned).sort(sortByName).map(code => (
                            <View key={code.id} style={s.scan}>
                              <View style={[s.circle, s.completeCircle, {backgroundColor: primaryColor}]}>
                                <Checkmark size={circleSize * 0.6} />
                              </View>
                              <Text style={s.codeTitle}>{code.name}</Text>
                            </View>)
                          )}
                          {this.renderScanPlaceholders(codesByCategory[cat.id], cat.scansRequired)}
                        </View>
                      ))
                    }
                    { categoriesToShow.length === 0 && scans !== null && done ? <View style={s.helpTextContainer}><Text style={s.helpText}>{t("helpTextCat")}</Text></View> : null }
                  </ScrollView>
                  <View style={s.buttons}>
                    { (categoriesToShow.length > 0 && !isDone) && <TouchableOpacity style={[s.button, {backgroundColor: primaryColor}]} onPress={this.scanCode}><Text style={s.buttonText}>{t("scan")}</Text></TouchableOpacity> }
                    { isAdmin && <TouchableOpacity style={[s.button, {backgroundColor: primaryColor}]} onPress={this.addCode}><Text style={s.buttonText}>{t("add")}</Text></TouchableOpacity> }
                  </View>
                </View>
        }
        { isDone && anyScans && !doneDismissed && this.renderDone() }
      </View>
    )
  }

  findTotalCatCodes = (cat, codesByCategory) => {
    //when you convert these objects to keys it includes the count object which needs to be filtered out in determining accurate amount of codes
    const number = codesByCategory[cat.id] ? Object.keys(codesByCategory[cat.id]).length - 1 : 0
    return number
  }

  renderScanPlaceholders(codesInCategory, numRequired) {
    const numScanned = codesInCategory.count || 0
    let remainingNames = Object.values(codesInCategory).filter(x => x && x.name && !x.isScanned).map(x => x.name)
    if (remainingNames.length > numRequired - numScanned) {
      remainingNames = range(numScanned + 1, numRequired + 1).map(num => `Scan #${num}`)
    }

    return remainingNames.map((name, i) => (
      <View key={i} style={s.scan}>
        <View style={[s.circle, s.placeholderCircle, {borderColor: this.state.primaryColor}]} />
        <Text style={s.codeTitle}>{name}</Text>
      </View>
    ))
  }

  renderWelcome() {
    return (
      <View style={s.container}>
        <View style={s.welcomeBox}>
          <Text style={s.welcomeTitle}>{this.state.title}</Text>
          <Text style={s.welcomeText}>{this.state.welcome}</Text>
          <View style={s.buttons}>
            <TouchableOpacity style={[s.button, {backgroundColor: this.state.primaryColor}]} onPress={this.dismissWelcome}><Text style={s.buttonText}>{t("play")}</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  renderDone() {
    return (
      <TouchableOpacity style={s.done} onPress={this.dismissDone}>
        <Star style={s.star} />
        <Text style={s.doneTitle}>{t("done")}</Text>
        <Text style={s.doneDesc}>{this.state.doneDescription}</Text>
      </TouchableOpacity>
    )
  }

  scanCode = () => this.setState({
    showScanner: true,
    isAdminScan: false
  })
  
  addCode = () => this.setState({
    showScanner: true,
    isAdminScan: true
  })

  onScan = (code) => this.state.isAdminScan ? this.onCodeAdded(code) : this.onCodeScanned(code)

  onCodeAdded = code => {
    this.codesRef().child(md5(code.data)).set({value: code.data, name: 'Added @ ' + new Date().toString()})
    this.setState({showScanner: false})
  }

  onCodeScanned = code => {
    const hash = md5(code.data)
    const namedCode = this.state.codes.find(c => c.id === hash)
    if (namedCode) {
      if (this.state.scans[hash]) {
        this.dismissScannerWithAlert(t("alertDup"))
      } else {
        this.scansRef().child(hash).set(true)
        this.dismissScannerWithAlert(t("alertComplete", {name: namedCode.name}))
      }
    } else {
      this.dismissScannerWithAlert(t("alertWrong"))
    }
  }

  dismissScannerWithAlert = (title, message) => {
    Alert.alert(title, message, [{ text: 'OK', onPress: () => this.setState({showScanner: false}) }], { cancelable: false })
  }

  cancelScan = () => this.setState({showScanner: false})

  dismissWelcome = () => this.setState({welcomeDismissed: true})
  dismissDone = () => this.setState({doneDismissed: true})
}

export default provideFirebaseConnectorToReactComponent(client, 'qrhunt', (props, fbc) => <HomeView {...props} fbc={fbc} />, PureComponent)

function sortByName(a, b) {
  return (a.name || '').toLowerCase() < (b.name || '').toLowerCase() ? -1 : 1
}

function range(start, end) {
  const arr = []
  for (let i = start; i < end; ++i) {
    arr.push(i)
  }
  return arr
}

const circleSize = 24
const charcoal = '#364247'
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFEFEF',
  },
  categoryHeader: {
    marginTop: 15,
    marginBottom: 10
  },
  scroll: {
    flex: 1,
    paddingVertical: 15
  },
  category: {
    fontSize: 16,
    textAlign: 'left',
    color: charcoal,
    flex: 1,
    fontWeight: "bold"
  },
  categoryDes: {
    fontSize: 14,
    textAlign: 'left',
    color: charcoal,
    flex: 1,
  },
  categoryRight: {
    fontSize: 14,
    textAlign: 'right',
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
    color: charcoal,
    flex: 1,
    flexWrap: "wrap",
  },
  circle: {
    height: circleSize,
    width: circleSize,
    borderRadius: circleSize / 2,
    marginRight: 10,
  },
  completeCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderCircle: {
    borderWidth: 2,
  },
  buttons: {
    flexDirection: 'row',
  },
  button: {
    margin: 15,
    padding: 15,
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

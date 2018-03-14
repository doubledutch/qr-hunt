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
import ReactNative, {
  ScrollView, Text, View
} from 'react-native'

import client, { Avatar, TitleBar } from '@doubledutch/rn-client'
import FirebaseConnector from '@doubledutch/firebase-connector'
const fbc = FirebaseConnector(client, 'qrhunt')

fbc.initializeAppWithSimpleBackend()

const scansRef = () => fbc.database.private.adminableUserRef('scans')

export default class HomeView extends Component {
  constructor() {
    super()

    this.signin = fbc.signin()
      .then(user => this.user = user)
      .catch(err => console.error(err))
  }

  state = {scans: []}

  componentDidMount() {
    this.signin.then(() => {
      scansRef().on('child_added', data => {
        this.setState(state => ({ scans: [...state.scans, {...data.val(), key: data.key }] }))
      })
      scansRef().on('child_removed', data => {
        this.setState(state => ({ scans: state.scans.filter(x => x.key !== data.key) }))
      })
    })
  }

  render() {
    const { scans } = this.state
    return (
      <View style={s.container}>
        <TitleBar title="Challenge" client={client} signin={this.signin} />
        <ScrollView style={s.scroll}>
          <Text>TODO</Text>
        </ScrollView>
      </View>
    )
  }
}

const fontSize = 18
const s = ReactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d9e1f9',
  },
  scroll: {
    flex: 1,
    padding: 15
  }
})

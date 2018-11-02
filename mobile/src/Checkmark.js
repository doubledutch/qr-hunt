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

import React from 'react'
import {View} from 'react-native'

export default ({color, size}) => (
  <View style={{height: size, width: size}}>
    <View style={{
      position: 'absolute',
      backgroundColor: color || '#fff',
      borderRadius: size*0.1,
      height: size * 0.5,
      width: size * 0.15,
      top: size * 0.42,
      left: size * 0.25,
      transform: [{rotate: '-45deg'}],
    }} />
    <View style={{
      position: 'absolute',
      backgroundColor: color || '#fff',
      borderRadius: size*0.1,
      height: size * 0.8,
      width: size * 0.15,
      top: size * 0.12,
      left: size * 0.6,
      transform: [{rotate: '40deg'}],
    }} />
  </View>
) 
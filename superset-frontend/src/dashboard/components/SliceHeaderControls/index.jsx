/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {
  Behavior,
  getChartMetadataRegistry,
  styled,
  t,
} from '@superset-ui/core';
import {Menu, NoAnimationDropdown} from 'src/common/components';
import ShareMenuItems from 'src/dashboard/components/menu/ShareMenuItems';
import downloadAsImage from 'src/utils/downloadAsImage';
import getDashboardUrl from 'src/dashboard/util/getDashboardUrl';
import {getActiveFilters} from 'src/dashboard/util/activeDashboardFilters';
import {FeatureFlag, isFeatureEnabled} from 'src/featureFlags';
import CrossFilterScopingModal from 'src/dashboard/components/CrossFilterScopingModal/CrossFilterScopingModal';
import fetchMock from 'fetch-mock';
import {exportChart, postForm} from "../../../explore/exploreUtils";


const propTypes = {
  slice: PropTypes.object.isRequired,
  componentId: PropTypes.string.isRequired,
  dashboardId: PropTypes.number.isRequired,
  addDangerToast: PropTypes.func.isRequired,
  isCached: PropTypes.arrayOf(PropTypes.bool),
  cachedDttm: PropTypes.arrayOf(PropTypes.string),
  isExpanded: PropTypes.bool,
  updatedDttm: PropTypes.number,
  supersetCanExplore: PropTypes.bool,
  supersetCanShare: PropTypes.bool,
  supersetCanCSV: PropTypes.bool,
  sliceCanEdit: PropTypes.bool,
  toggleExpandSlice: PropTypes.func,
  forceRefresh: PropTypes.func,
  exploreChart: PropTypes.func,
  exportCSV: PropTypes.func,
};

const defaultProps = {
  forceRefresh: () => ({}),
  toggleExpandSlice: () => ({}),
  exploreChart: () => ({}),
  exportCSV: () => ({}),
  cachedDttm: [],
  updatedDttm: null,
  isCached: [],
  isExpanded: false,
  supersetCanExplore: false,
  supersetCanShare: false,
  supersetCanCSV: false,
  sliceCanEdit: false,
};

const MENU_KEYS = {
  CROSS_FILTER_SCOPING: 'cross_filter_scoping',
  FORCE_REFRESH: 'force_refresh',
  TOGGLE_CHART_DESCRIPTION: 'toggle_chart_description',
  EXPLORE_CHART: 'explore_chart',
  EXPORT_CSV: 'export_csv',
  RESIZE_LABEL: 'resize_label',
  DOWNLOAD_AS_IMAGE: 'download_as_image',
};

const VerticalDotsContainer = styled.div`
  padding: ${({theme}) => theme.gridUnit / 4}px
    ${({theme}) => theme.gridUnit * 1.5}px;

  .dot {
    display: block;
  }

  &:hover {
    cursor: pointer;
  }
`;

const RefreshTooltip = styled.div`
  height: auto;
  margin: ${({theme}) => theme.gridUnit}px 0;
  color: ${({theme}) => theme.colors.grayscale.base};
  line-height: ${({theme}) => theme.typography.sizes.m * 1.5}px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
`;

const SCREENSHOT_NODE_SELECTOR = '.dashboard-component-chart-holder';

const VerticalDotsTrigger = () => (
  <VerticalDotsContainer>
    <span className="dot"/>
    <span className="dot"/>
    <span className="dot"/>
  </VerticalDotsContainer>
);


function exportTableToExcelV2(tables, filename = '') {
  let table = document.createElement('table');

  for (let i = 0; i < tables.length; i++) {
    const secTable = tables[i].cloneNode(true);
    for (let j = 0; j < secTable.children.length; j++) {
      table.appendChild(secTable.children[j].cloneNode(true));
    }
  }

  console.log(table);
  let tableHTML = table.outerHTML.replace('<tfoot>', '').replace('</tfoot>', '');
  console.log(tableHTML);

  tableHTML = '<table><thead><tr><th colspan="2" rowspan="2"></th><th class="pvtAxisLabel">metric</th><th class="pvtColLabel" colspan="40" rowspan="1">Количество магазинов</th></tr><tr><th class="pvtAxisLabel">month</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2018-01</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2018-02</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2018-03</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2018-04</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2018-05</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2018-06</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2018-07</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2018-08</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2018-09</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2018-10</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2018-11</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2018-12</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2019-01</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2019-02</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2019-03</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2019-04</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2019-05</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2019-06</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2019-07</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2019-08</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2019-09</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2019-10</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2019-11</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2019-12</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2020-01</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2020-02</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2020-03</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2020-04</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2020-05</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2020-06</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2020-07</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2020-08</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2020-09</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2020-10</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2020-11</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2020-12</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2021-01</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2021-02</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2021-03</th><th class="pvtColLabel label-centered" colspan="1" rowspan="2">2021-04</th></tr><tr><th class="pvtAxisLabel"><span class="toggle-wrapper"><span class="toggle">▼ </span><span class="toggle-val">region_tt</span></span></th><th class="pvtAxisLabel">tt_format</th><th class="pvtTotalLabel"></th></tr></thead><tbody><tr><th class="pvtRowLabel" rowspan="4" colspan="1"><span class="toggle-wrapper"><span class="toggle">▼ </span><span class="toggle-val">МО</span></span></th><th class="pvtRowLabel" rowspan="1" colspan="2">ВкусВилл</th><td class="pvtVal" style="background-color: rgb(255, 224, 224);">120</td><td class="pvtVal" style="background-color: rgb(255, 222, 222);">126</td><td class="pvtVal" style="background-color: rgb(255, 221, 221);">131</td><td class="pvtVal" style="background-color: rgb(255, 221, 221);">130</td><td class="pvtVal" style="background-color: rgb(255, 221, 221);">130</td><td class="pvtVal" style="background-color: rgb(255, 221, 221);">132</td><td class="pvtVal" style="background-color: rgb(255, 219, 219);">137</td><td class="pvtVal" style="background-color: rgb(255, 219, 219);">138</td><td class="pvtVal" style="background-color: rgb(255, 216, 216);">148</td><td class="pvtVal" style="background-color: rgb(255, 216, 216);">151</td><td class="pvtVal" style="background-color: rgb(255, 215, 215);">153</td><td class="pvtVal" style="background-color: rgb(255, 215, 215);">154</td><td class="pvtVal" style="background-color: rgb(255, 215, 215);">154</td><td class="pvtVal" style="background-color: rgb(255, 213, 213);">161</td><td class="pvtVal" style="background-color: rgb(255, 211, 211);">167</td><td class="pvtVal" style="background-color: rgb(255, 208, 208);">178</td><td class="pvtVal" style="background-color: rgb(255, 207, 207);">183</td><td class="pvtVal" style="background-color: rgb(255, 204, 204);">196</td><td class="pvtVal" style="background-color: rgb(255, 201, 201);">205</td><td class="pvtVal" style="background-color: rgb(255, 200, 200);">212</td><td class="pvtVal" style="background-color: rgb(255, 197, 197);">221</td><td class="pvtVal" style="background-color: rgb(255, 196, 196);">226</td><td class="pvtVal" style="background-color: rgb(255, 195, 195);">228</td><td class="pvtVal" style="background-color: rgb(255, 193, 193);">238</td><td class="pvtVal" style="background-color: rgb(255, 192, 192);">240</td><td class="pvtVal" style="background-color: rgb(255, 191, 191);">244</td><td class="pvtVal" style="background-color: rgb(255, 189, 189);">251</td><td class="pvtVal" style="background-color: rgb(255, 189, 189);">251</td><td class="pvtVal" style="background-color: rgb(255, 189, 189);">253</td><td class="pvtVal" style="background-color: rgb(255, 189, 189);">252</td><td class="pvtVal" style="background-color: rgb(255, 188, 188);">256</td><td class="pvtVal" style="background-color: rgb(255, 188, 188);">257</td><td class="pvtVal" style="background-color: rgb(255, 187, 187);">259</td><td class="pvtVal" style="background-color: rgb(255, 187, 187);">260</td><td class="pvtVal" style="background-color: rgb(255, 187, 187);">261</td><td class="pvtVal" style="background-color: rgb(255, 185, 185);">267</td><td class="pvtVal" style="background-color: rgb(255, 187, 187);">261</td><td class="pvtVal" style="background-color: rgb(255, 185, 185);">268</td><td class="pvtVal" style="background-color: rgb(255, 183, 183);">275</td><td class="pvtVal" style="background-color: rgb(255, 182, 182);">279</td></tr><tr><th class="pvtRowLabel" rowspan="1" colspan="2">Минимаркет</th><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">1</td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">1</td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">2</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">3</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">3</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">5</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">5</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">5</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">3</td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">2</td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">3</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">3</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">3</td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">2</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">3</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">4</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">5</td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">2</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">6</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">3</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">6</td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">1</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">3</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">4</td></tr><tr><th class="pvtRowLabel" rowspan="1" colspan="2">Шмель</th><td class="pvtVal" style="background-color: rgb(255, 254, 254);">6</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">6</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">6</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">6</td><td class="pvtVal" style="background-color: rgb(255, 253, 253);">7</td><td class="pvtVal" style="background-color: rgb(255, 253, 253);">7</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">6</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">6</td><td class="pvtVal" style="background-color: rgb(255, 253, 253);">7</td><td class="pvtVal" style="background-color: rgb(255, 253, 253);">8</td><td class="pvtVal" style="background-color: rgb(255, 253, 253);">8</td><td class="pvtVal" style="background-color: rgb(255, 253, 253);">8</td><td class="pvtVal" style="background-color: rgb(255, 253, 253);">9</td><td class="pvtVal" style="background-color: rgb(255, 253, 253);">10</td><td class="pvtVal" style="background-color: rgb(255, 252, 252);">11</td><td class="pvtVal" style="background-color: rgb(255, 252, 252);">13</td><td class="pvtVal" style="background-color: rgb(255, 251, 251);">15</td><td class="pvtVal" style="background-color: rgb(255, 249, 249);">24</td><td class="pvtVal" style="background-color: rgb(255, 247, 247);">32</td><td class="pvtVal" style="background-color: rgb(255, 246, 246);">37</td><td class="pvtVal" style="background-color: rgb(255, 244, 244);">41</td><td class="pvtVal" style="background-color: rgb(255, 244, 244);">43</td><td class="pvtVal" style="background-color: rgb(255, 243, 243);">48</td><td class="pvtVal" style="background-color: rgb(255, 240, 240);">58</td><td class="pvtVal" style="background-color: rgb(255, 240, 240);">57</td><td class="pvtVal" style="background-color: rgb(255, 239, 239);">62</td><td class="pvtVal" style="background-color: rgb(255, 239, 239);">62</td><td class="pvtVal" style="background-color: rgb(255, 239, 239);">61</td><td class="pvtVal" style="background-color: rgb(255, 240, 240);">57</td><td class="pvtVal" style="background-color: rgb(255, 240, 240);">57</td><td class="pvtVal" style="background-color: rgb(255, 241, 241);">54</td><td class="pvtVal" style="background-color: rgb(255, 241, 241);">53</td><td class="pvtVal" style="background-color: rgb(255, 242, 242);">52</td><td class="pvtVal" style="background-color: rgb(255, 242, 242);">51</td><td class="pvtVal" style="background-color: rgb(255, 243, 243);">48</td><td class="pvtVal" style="background-color: rgb(255, 242, 242);">49</td><td class="pvtVal" style="background-color: rgb(255, 243, 243);">47</td><td class="pvtVal" style="background-color: rgb(255, 243, 243);">45</td><td class="pvtVal" style="background-color: rgb(255, 243, 243);">46</td><td class="pvtVal" style="background-color: rgb(255, 243, 243);">46</td></tr><tr><th class="pvtRowLabel" colspan="2" rowspan="1">Totals</th><td class="pvtVal" style="background-color: rgb(255, 222, 222);">126</td><td class="pvtVal" style="background-color: rgb(255, 221, 221);">132</td><td class="pvtVal" style="background-color: rgb(255, 219, 219);">137</td><td class="pvtVal" style="background-color: rgb(255, 220, 220);">136</td><td class="pvtVal" style="background-color: rgb(255, 219, 219);">137</td><td class="pvtVal" style="background-color: rgb(255, 219, 219);">139</td><td class="pvtVal" style="background-color: rgb(255, 218, 218);">143</td><td class="pvtVal" style="background-color: rgb(255, 217, 217);">144</td><td class="pvtVal" style="background-color: rgb(255, 215, 215);">155</td><td class="pvtVal" style="background-color: rgb(255, 213, 213);">160</td><td class="pvtVal" style="background-color: rgb(255, 213, 213);">162</td><td class="pvtVal" style="background-color: rgb(255, 213, 213);">162</td><td class="pvtVal" style="background-color: rgb(255, 212, 212);">163</td><td class="pvtVal" style="background-color: rgb(255, 210, 210);">171</td><td class="pvtVal" style="background-color: rgb(255, 208, 208);">178</td><td class="pvtVal" style="background-color: rgb(255, 205, 205);">193</td><td class="pvtVal" style="background-color: rgb(255, 202, 202);">201</td><td class="pvtVal" style="background-color: rgb(255, 197, 197);">223</td><td class="pvtVal" style="background-color: rgb(255, 192, 192);">242</td><td class="pvtVal" style="background-color: rgb(255, 188, 188);">254</td><td class="pvtVal" style="background-color: rgb(255, 185, 185);">267</td><td class="pvtVal" style="background-color: rgb(255, 184, 184);">272</td><td class="pvtVal" style="background-color: rgb(255, 182, 182);">278</td><td class="pvtVal" style="background-color: rgb(255, 177, 177);">296</td><td class="pvtVal" style="background-color: rgb(255, 176, 176);">300</td><td class="pvtVal" style="background-color: rgb(255, 174, 174);">309</td><td class="pvtVal" style="background-color: rgb(255, 172, 172);">316</td><td class="pvtVal" style="background-color: rgb(255, 173, 173);">312</td><td class="pvtVal" style="background-color: rgb(255, 174, 174);">310</td><td class="pvtVal" style="background-color: rgb(255, 174, 174);">311</td><td class="pvtVal" style="background-color: rgb(255, 173, 173);">313</td><td class="pvtVal" style="background-color: rgb(255, 173, 173);">314</td><td class="pvtVal" style="background-color: rgb(255, 172, 172);">316</td><td class="pvtVal" style="background-color: rgb(255, 173, 173);">313</td><td class="pvtVal" style="background-color: rgb(255, 172, 172);">315</td><td class="pvtVal" style="background-color: rgb(255, 171, 171);">319</td><td class="pvtVal" style="background-color: rgb(255, 173, 173);">314</td><td class="pvtVal" style="background-color: rgb(255, 173, 173);">314</td><td class="pvtVal" style="background-color: rgb(255, 170, 170);">324</td><td class="pvtVal" style="background-color: rgb(255, 169, 169);">329</td></tr><tr><th class="pvtRowLabel" rowspan="4" colspan="1"><span class="toggle-wrapper"><span class="toggle">▼ </span><span class="toggle-val">Москва</span></span></th><th class="pvtRowLabel" rowspan="1" colspan="2">ВкусВилл</th><td class="pvtVal" style="background-color: rgb(255, 170, 170);">325</td><td class="pvtVal" style="background-color: rgb(255, 164, 164);">349</td><td class="pvtVal" style="background-color: rgb(255, 158, 158);">369</td><td class="pvtVal" style="background-color: rgb(255, 153, 153);">389</td><td class="pvtVal" style="background-color: rgb(255, 148, 148);">409</td><td class="pvtVal" style="background-color: rgb(255, 143, 143);">427</td><td class="pvtVal" style="background-color: rgb(255, 140, 140);">439</td><td class="pvtVal" style="background-color: rgb(255, 137, 137);">450</td><td class="pvtVal" style="background-color: rgb(255, 132, 132);">467</td><td class="pvtVal" style="background-color: rgb(255, 132, 132);">469</td><td class="pvtVal" style="background-color: rgb(255, 130, 130);">477</td><td class="pvtVal" style="background-color: rgb(255, 126, 126);">490</td><td class="pvtVal" style="background-color: rgb(255, 125, 125);">495</td><td class="pvtVal" style="background-color: rgb(255, 121, 121);">510</td><td class="pvtVal" style="background-color: rgb(255, 119, 119);">517</td><td class="pvtVal" style="background-color: rgb(255, 114, 114);">536</td><td class="pvtVal" style="background-color: rgb(255, 112, 112);">545</td><td class="pvtVal" style="background-color: rgb(255, 110, 110);">554</td><td class="pvtVal" style="background-color: rgb(255, 108, 108);">559</td><td class="pvtVal" style="background-color: rgb(255, 106, 106);">567</td><td class="pvtVal" style="background-color: rgb(255, 104, 104);">576</td><td class="pvtVal" style="background-color: rgb(255, 99, 99);">593</td><td class="pvtVal" style="background-color: rgb(255, 98, 98);">599</td><td class="pvtVal" style="background-color: rgb(255, 94, 94);">613</td><td class="pvtVal" style="background-color: rgb(255, 94, 94);">613</td><td class="pvtVal" style="background-color: rgb(255, 93, 93);">619</td><td class="pvtVal" style="background-color: rgb(255, 89, 89);">633</td><td class="pvtVal" style="background-color: rgb(255, 92, 92);">621</td><td class="pvtVal" style="background-color: rgb(255, 92, 92);">621</td><td class="pvtVal" style="background-color: rgb(255, 91, 91);">625</td><td class="pvtVal" style="background-color: rgb(255, 91, 91);">623</td><td class="pvtVal" style="background-color: rgb(255, 93, 93);">616</td><td class="pvtVal" style="background-color: rgb(255, 92, 92);">622</td><td class="pvtVal" style="background-color: rgb(255, 92, 92);">622</td><td class="pvtVal" style="background-color: rgb(255, 91, 91);">625</td><td class="pvtVal" style="background-color: rgb(255, 86, 86);">643</td><td class="pvtVal" style="background-color: rgb(255, 88, 88);">636</td><td class="pvtVal" style="background-color: rgb(255, 87, 87);">641</td><td class="pvtVal" style="background-color: rgb(255, 82, 82);">660</td><td class="pvtVal" style="background-color: rgb(255, 79, 79);">671</td></tr><tr><th class="pvtRowLabel" rowspan="1" colspan="2">Минимаркет</th><td class="pvtVal" style="background-color: rgb(255, 255, 255);">1</td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">1</td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">1</td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">1</td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">2</td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">1</td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">2</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">3</td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">2</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">6</td><td class="pvtVal" style="background-color: rgb(255, 253, 253);">7</td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">2</td><td class="pvtVal" style="background-color: rgb(255, 252, 252);">12</td><td class="pvtVal" style="background-color: rgb(255, 252, 252);">13</td><td class="pvtVal" style="background-color: rgb(255, 252, 252);">14</td><td class="pvtVal" style="background-color: rgb(255, 248, 248);">28</td><td class="pvtVal" style="background-color: rgb(255, 245, 245);">39</td><td class="pvtVal" style="background-color: rgb(255, 249, 249);">23</td><td class="pvtVal" style="background-color: rgb(255, 236, 236);">72</td><td class="pvtVal" style="background-color: rgb(255, 235, 235);">76</td><td class="pvtVal" style="background-color: rgb(255, 222, 222);">127</td><td class="pvtVal" style="background-color: rgb(255, 218, 218);">142</td><td class="pvtVal" style="background-color: rgb(255, 221, 221);">130</td><td class="pvtVal" style="background-color: rgb(255, 248, 248);">29</td><td class="pvtVal" style="background-color: rgb(255, 198, 198);">216</td><td class="pvtVal" style="background-color: rgb(255, 206, 206);">188</td><td class="pvtVal" style="background-color: rgb(255, 210, 210);">171</td><td class="pvtVal" style="background-color: rgb(255, 249, 249);">22</td><td class="pvtVal" style="background-color: rgb(255, 253, 253);">9</td><td class="pvtVal" style="background-color: rgb(255, 240, 240);">57</td><td class="pvtVal" style="background-color: rgb(255, 230, 230);">95</td><td class="pvtVal" style="background-color: rgb(255, 218, 218);">140</td><td class="pvtVal" style="background-color: rgb(255, 204, 204);">196</td><td class="pvtVal" style="background-color: rgb(255, 226, 226);">111</td><td class="pvtVal" style="background-color: rgb(255, 214, 214);">158</td><td class="pvtVal" style="background-color: rgb(255, 239, 239);">61</td><td class="pvtVal" style="background-color: rgb(255, 230, 230);">96</td><td class="pvtVal" style="background-color: rgb(255, 227, 227);">107</td><td class="pvtVal" style="background-color: rgb(255, 203, 203);">200</td><td class="pvtVal" style="background-color: rgb(255, 196, 196);">226</td></tr><tr><th class="pvtRowLabel" rowspan="1" colspan="2">Шмель</th><td class="pvtVal" style="background-color: rgb(255, 252, 252);">12</td><td class="pvtVal" style="background-color: rgb(255, 252, 252);">12</td><td class="pvtVal" style="background-color: rgb(255, 252, 252);">13</td><td class="pvtVal" style="background-color: rgb(255, 252, 252);">13</td><td class="pvtVal" style="background-color: rgb(255, 252, 252);">14</td><td class="pvtVal" style="background-color: rgb(255, 251, 251);">15</td><td class="pvtVal" style="background-color: rgb(255, 251, 251);">17</td><td class="pvtVal" style="background-color: rgb(255, 251, 251);">18</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">21</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">21</td><td class="pvtVal" style="background-color: rgb(255, 249, 249);">24</td><td class="pvtVal" style="background-color: rgb(255, 249, 249);">25</td><td class="pvtVal" style="background-color: rgb(255, 249, 249);">24</td><td class="pvtVal" style="background-color: rgb(255, 249, 249);">24</td><td class="pvtVal" style="background-color: rgb(255, 248, 248);">28</td><td class="pvtVal" style="background-color: rgb(255, 246, 246);">34</td><td class="pvtVal" style="background-color: rgb(255, 245, 245);">39</td><td class="pvtVal" style="background-color: rgb(255, 242, 242);">49</td><td class="pvtVal" style="background-color: rgb(255, 241, 241);">54</td><td class="pvtVal" style="background-color: rgb(255, 238, 238);">65</td><td class="pvtVal" style="background-color: rgb(255, 234, 234);">79</td><td class="pvtVal" style="background-color: rgb(255, 232, 232);">87</td><td class="pvtVal" style="background-color: rgb(255, 230, 230);">95</td><td class="pvtVal" style="background-color: rgb(255, 226, 226);">113</td><td class="pvtVal" style="background-color: rgb(255, 225, 225);">116</td><td class="pvtVal" style="background-color: rgb(255, 222, 222);">127</td><td class="pvtVal" style="background-color: rgb(255, 220, 220);">133</td><td class="pvtVal" style="background-color: rgb(255, 223, 223);">121</td><td class="pvtVal" style="background-color: rgb(255, 227, 227);">108</td><td class="pvtVal" style="background-color: rgb(255, 229, 229);">101</td><td class="pvtVal" style="background-color: rgb(255, 231, 231);">94</td><td class="pvtVal" style="background-color: rgb(255, 233, 233);">86</td><td class="pvtVal" style="background-color: rgb(255, 233, 233);">86</td><td class="pvtVal" style="background-color: rgb(255, 233, 233);">83</td><td class="pvtVal" style="background-color: rgb(255, 233, 233);">83</td><td class="pvtVal" style="background-color: rgb(255, 234, 234);">80</td><td class="pvtVal" style="background-color: rgb(255, 234, 234);">80</td><td class="pvtVal" style="background-color: rgb(255, 235, 235);">78</td><td class="pvtVal" style="background-color: rgb(255, 236, 236);">74</td><td class="pvtVal" style="background-color: rgb(255, 236, 236);">74</td></tr><tr><th class="pvtRowLabel" colspan="2" rowspan="1">Totals</th><td class="pvtVal" style="background-color: rgb(255, 166, 166);">338</td><td class="pvtVal" style="background-color: rgb(255, 160, 160);">362</td><td class="pvtVal" style="background-color: rgb(255, 155, 155);">383</td><td class="pvtVal" style="background-color: rgb(255, 149, 149);">403</td><td class="pvtVal" style="background-color: rgb(255, 144, 144);">425</td><td class="pvtVal" style="background-color: rgb(255, 139, 139);">443</td><td class="pvtVal" style="background-color: rgb(255, 135, 135);">458</td><td class="pvtVal" style="background-color: rgb(255, 131, 131);">471</td><td class="pvtVal" style="background-color: rgb(255, 126, 126);">490</td><td class="pvtVal" style="background-color: rgb(255, 125, 125);">496</td><td class="pvtVal" style="background-color: rgb(255, 122, 122);">508</td><td class="pvtVal" style="background-color: rgb(255, 119, 119);">517</td><td class="pvtVal" style="background-color: rgb(255, 116, 116);">531</td><td class="pvtVal" style="background-color: rgb(255, 111, 111);">547</td><td class="pvtVal" style="background-color: rgb(255, 108, 108);">559</td><td class="pvtVal" style="background-color: rgb(255, 98, 98);">598</td><td class="pvtVal" style="background-color: rgb(255, 91, 91);">623</td><td class="pvtVal" style="background-color: rgb(255, 91, 91);">626</td><td class="pvtVal" style="background-color: rgb(255, 75, 75);">685</td><td class="pvtVal" style="background-color: rgb(255, 69, 69);">708</td><td class="pvtVal" style="background-color: rgb(255, 50, 50);">782</td><td class="pvtVal" style="background-color: rgb(255, 39, 39);">822</td><td class="pvtVal" style="background-color: rgb(255, 39, 39);">824</td><td class="pvtVal" style="background-color: rgb(255, 57, 57);">755</td><td class="pvtVal" style="background-color: rgb(255, 7, 7);">945</td><td class="pvtVal" style="background-color: rgb(255, 10, 10);">934</td><td class="pvtVal" style="background-color: rgb(255, 9, 9);">937</td><td class="pvtVal" style="background-color: rgb(255, 54, 54);">764</td><td class="pvtVal" style="background-color: rgb(255, 61, 61);">738</td><td class="pvtVal" style="background-color: rgb(255, 49, 49);">783</td><td class="pvtVal" style="background-color: rgb(255, 42, 42);">812</td><td class="pvtVal" style="background-color: rgb(255, 34, 34);">842</td><td class="pvtVal" style="background-color: rgb(255, 18, 18);">904</td><td class="pvtVal" style="background-color: rgb(255, 41, 41);">816</td><td class="pvtVal" style="background-color: rgb(255, 28, 28);">866</td><td class="pvtVal" style="background-color: rgb(255, 49, 49);">784</td><td class="pvtVal" style="background-color: rgb(255, 42, 42);">812</td><td class="pvtVal" style="background-color: rgb(255, 38, 38);">826</td><td class="pvtVal" style="background-color: rgb(255, 10, 10);">934</td><td class="pvtVal" style="background-color: rgb(255, 0, 0);">971</td></tr><tr><th class="pvtRowLabel" rowspan="3" colspan="1"><span class="toggle-wrapper"><span class="toggle">▼ </span><span class="toggle-val">Регионы</span></span></th><th class="pvtRowLabel" rowspan="1" colspan="2">ВкусВилл</th><td class="pvtVal" style="background-color: rgb(255, 253, 253);">9</td><td class="pvtVal" style="background-color: rgb(255, 252, 252);">14</td><td class="pvtVal" style="background-color: rgb(255, 252, 252);">14</td><td class="pvtVal" style="background-color: rgb(255, 252, 252);">14</td><td class="pvtVal" style="background-color: rgb(255, 251, 251);">17</td><td class="pvtVal" style="background-color: rgb(255, 251, 251);">18</td><td class="pvtVal" style="background-color: rgb(255, 251, 251);">17</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">20</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">20</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">21</td><td class="pvtVal" style="background-color: rgb(255, 249, 249);">23</td><td class="pvtVal" style="background-color: rgb(255, 249, 249);">22</td><td class="pvtVal" style="background-color: rgb(255, 249, 249);">23</td><td class="pvtVal" style="background-color: rgb(255, 248, 248);">27</td><td class="pvtVal" style="background-color: rgb(255, 247, 247);">31</td><td class="pvtVal" style="background-color: rgb(255, 246, 246);">34</td><td class="pvtVal" style="background-color: rgb(255, 246, 246);">37</td><td class="pvtVal" style="background-color: rgb(255, 245, 245);">39</td><td class="pvtVal" style="background-color: rgb(255, 244, 244);">42</td><td class="pvtVal" style="background-color: rgb(255, 243, 243);">45</td><td class="pvtVal" style="background-color: rgb(255, 242, 242);">49</td><td class="pvtVal" style="background-color: rgb(255, 241, 241);">53</td><td class="pvtVal" style="background-color: rgb(255, 241, 241);">56</td><td class="pvtVal" style="background-color: rgb(255, 240, 240);">59</td><td class="pvtVal" style="background-color: rgb(255, 239, 239);">63</td><td class="pvtVal" style="background-color: rgb(255, 238, 238);">66</td><td class="pvtVal" style="background-color: rgb(255, 237, 237);">70</td><td class="pvtVal" style="background-color: rgb(255, 237, 237);">69</td><td class="pvtVal" style="background-color: rgb(255, 237, 237);">69</td><td class="pvtVal" style="background-color: rgb(255, 237, 237);">69</td><td class="pvtVal" style="background-color: rgb(255, 237, 237);">71</td><td class="pvtVal" style="background-color: rgb(255, 237, 237);">71</td><td class="pvtVal" style="background-color: rgb(255, 237, 237);">71</td><td class="pvtVal" style="background-color: rgb(255, 236, 236);">72</td><td class="pvtVal" style="background-color: rgb(255, 236, 236);">73</td><td class="pvtVal" style="background-color: rgb(255, 235, 235);">77</td><td class="pvtVal" style="background-color: rgb(255, 236, 236);">73</td><td class="pvtVal" style="background-color: rgb(255, 234, 234);">80</td><td class="pvtVal" style="background-color: rgb(255, 232, 232);">90</td><td class="pvtVal" style="background-color: rgb(255, 230, 230);">95</td></tr><tr><th class="pvtRowLabel" rowspan="1" colspan="2">Шмель</th><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">1</td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">2</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">3</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">4</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">3</td><td class="pvtVal" style="background-color: rgb(255, 253, 253);">7</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">6</td><td class="pvtVal" style="background-color: rgb(255, 253, 253);">8</td><td class="pvtVal" style="background-color: rgb(255, 253, 253);">10</td><td class="pvtVal" style="background-color: rgb(255, 253, 253);">9</td><td class="pvtVal" style="background-color: rgb(255, 252, 252);">12</td><td class="pvtVal" style="background-color: rgb(255, 252, 252);">13</td><td class="pvtVal" style="background-color: rgb(255, 251, 251);">15</td><td class="pvtVal" style="background-color: rgb(255, 251, 251);">17</td><td class="pvtVal" style="background-color: rgb(255, 251, 251);">18</td><td class="pvtVal" style="background-color: rgb(255, 249, 249);">23</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">21</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">21</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">20</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">20</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">19</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">19</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">19</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">19</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">21</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">19</td><td class="pvtVal" style="background-color: rgb(255, 251, 251);">18</td><td class="pvtVal" style="background-color: rgb(255, 251, 251);">18</td><td class="pvtVal" style="background-color: rgb(255, 251, 251);">18</td></tr><tr><th class="pvtRowLabel" colspan="2" rowspan="1">Totals</th><td class="pvtVal" style="background-color: rgb(255, 253, 253);">9</td><td class="pvtVal" style="background-color: rgb(255, 252, 252);">14</td><td class="pvtVal" style="background-color: rgb(255, 252, 252);">14</td><td class="pvtVal" style="background-color: rgb(255, 252, 252);">14</td><td class="pvtVal" style="background-color: rgb(255, 251, 251);">17</td><td class="pvtVal" style="background-color: rgb(255, 251, 251);">18</td><td class="pvtVal" style="background-color: rgb(255, 251, 251);">17</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">20</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">20</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">21</td><td class="pvtVal" style="background-color: rgb(255, 249, 249);">23</td><td class="pvtVal" style="background-color: rgb(255, 249, 249);">23</td><td class="pvtVal" style="background-color: rgb(255, 249, 249);">25</td><td class="pvtVal" style="background-color: rgb(255, 247, 247);">30</td><td class="pvtVal" style="background-color: rgb(255, 246, 246);">35</td><td class="pvtVal" style="background-color: rgb(255, 246, 246);">37</td><td class="pvtVal" style="background-color: rgb(255, 244, 244);">44</td><td class="pvtVal" style="background-color: rgb(255, 243, 243);">45</td><td class="pvtVal" style="background-color: rgb(255, 242, 242);">50</td><td class="pvtVal" style="background-color: rgb(255, 241, 241);">55</td><td class="pvtVal" style="background-color: rgb(255, 240, 240);">58</td><td class="pvtVal" style="background-color: rgb(255, 238, 238);">65</td><td class="pvtVal" style="background-color: rgb(255, 237, 237);">69</td><td class="pvtVal" style="background-color: rgb(255, 236, 236);">74</td><td class="pvtVal" style="background-color: rgb(255, 234, 234);">80</td><td class="pvtVal" style="background-color: rgb(255, 233, 233);">84</td><td class="pvtVal" style="background-color: rgb(255, 231, 231);">93</td><td class="pvtVal" style="background-color: rgb(255, 232, 232);">90</td><td class="pvtVal" style="background-color: rgb(255, 232, 232);">90</td><td class="pvtVal" style="background-color: rgb(255, 232, 232);">89</td><td class="pvtVal" style="background-color: rgb(255, 231, 231);">91</td><td class="pvtVal" style="background-color: rgb(255, 232, 232);">90</td><td class="pvtVal" style="background-color: rgb(255, 232, 232);">90</td><td class="pvtVal" style="background-color: rgb(255, 231, 231);">91</td><td class="pvtVal" style="background-color: rgb(255, 231, 231);">92</td><td class="pvtVal" style="background-color: rgb(255, 229, 229);">98</td><td class="pvtVal" style="background-color: rgb(255, 231, 231);">92</td><td class="pvtVal" style="background-color: rgb(255, 229, 229);">98</td><td class="pvtVal" style="background-color: rgb(255, 227, 227);">108</td><td class="pvtVal" style="background-color: rgb(255, 226, 226);">113</td></tr><tr><th class="pvtRowLabel" rowspan="3" colspan="1"><span class="toggle-wrapper"><span class="toggle">▼ </span><span class="toggle-val">Санкт-Петербург</span></span></th><th class="pvtRowLabel" rowspan="1" colspan="2">ВкусВилл</th><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">2</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">4</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">3</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">3</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">5</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">6</td><td class="pvtVal" style="background-color: rgb(255, 253, 253);">7</td><td class="pvtVal" style="background-color: rgb(255, 252, 252);">11</td><td class="pvtVal" style="background-color: rgb(255, 252, 252);">13</td><td class="pvtVal" style="background-color: rgb(255, 251, 251);">16</td><td class="pvtVal" style="background-color: rgb(255, 249, 249);">23</td><td class="pvtVal" style="background-color: rgb(255, 248, 248);">26</td><td class="pvtVal" style="background-color: rgb(255, 246, 246);">34</td><td class="pvtVal" style="background-color: rgb(255, 244, 244);">42</td><td class="pvtVal" style="background-color: rgb(255, 242, 242);">52</td><td class="pvtVal" style="background-color: rgb(255, 241, 241);">55</td><td class="pvtVal" style="background-color: rgb(255, 239, 239);">61</td><td class="pvtVal" style="background-color: rgb(255, 238, 238);">66</td><td class="pvtVal" style="background-color: rgb(255, 236, 236);">73</td><td class="pvtVal" style="background-color: rgb(255, 234, 234);">79</td><td class="pvtVal" style="background-color: rgb(255, 233, 233);">83</td><td class="pvtVal" style="background-color: rgb(255, 233, 233);">86</td><td class="pvtVal" style="background-color: rgb(255, 230, 230);">96</td><td class="pvtVal" style="background-color: rgb(255, 232, 232);">90</td><td class="pvtVal" style="background-color: rgb(255, 232, 232);">90</td><td class="pvtVal" style="background-color: rgb(255, 231, 231);">93</td><td class="pvtVal" style="background-color: rgb(255, 231, 231);">91</td><td class="pvtVal" style="background-color: rgb(255, 232, 232);">88</td><td class="pvtVal" style="background-color: rgb(255, 232, 232);">89</td><td class="pvtVal" style="background-color: rgb(255, 232, 232);">89</td><td class="pvtVal" style="background-color: rgb(255, 232, 232);">89</td><td class="pvtVal" style="background-color: rgb(255, 231, 231);">92</td><td class="pvtVal" style="background-color: rgb(255, 231, 231);">93</td><td class="pvtVal" style="background-color: rgb(255, 231, 231);">92</td><td class="pvtVal" style="background-color: rgb(255, 228, 228);">103</td><td class="pvtVal" style="background-color: rgb(255, 229, 229);">100</td></tr><tr><th class="pvtRowLabel" rowspan="1" colspan="2">Шмель</th><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">1</td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">1</td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">1</td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">1</td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">2</td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">2</td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">1</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">3</td><td class="pvtVal" style="background-color: rgb(255, 252, 252);">12</td><td class="pvtVal" style="background-color: rgb(255, 251, 251);">15</td><td class="pvtVal" style="background-color: rgb(255, 251, 251);">15</td><td class="pvtVal" style="background-color: rgb(255, 249, 249);">24</td><td class="pvtVal" style="background-color: rgb(255, 249, 249);">25</td><td class="pvtVal" style="background-color: rgb(255, 249, 249);">25</td><td class="pvtVal" style="background-color: rgb(255, 249, 249);">25</td><td class="pvtVal" style="background-color: rgb(255, 249, 249);">23</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">20</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">20</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">19</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">20</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">19</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">20</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">21</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">21</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">20</td><td class="pvtVal" style="background-color: rgb(255, 250, 250);">20</td></tr><tr><th class="pvtRowLabel" colspan="2" rowspan="1">Totals</th><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);"></td><td class="pvtVal" style="background-color: rgb(255, 255, 255);">2</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">4</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">3</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">3</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">5</td><td class="pvtVal" style="background-color: rgb(255, 254, 254);">6</td><td class="pvtVal" style="background-color: rgb(255, 253, 253);">7</td><td class="pvtVal" style="background-color: rgb(255, 252, 252);">11</td><td class="pvtVal" style="background-color: rgb(255, 252, 252);">13</td><td class="pvtVal" style="background-color: rgb(255, 251, 251);">16</td><td class="pvtVal" style="background-color: rgb(255, 249, 249);">24</td><td class="pvtVal" style="background-color: rgb(255, 248, 248);">27</td><td class="pvtVal" style="background-color: rgb(255, 246, 246);">35</td><td class="pvtVal" style="background-color: rgb(255, 244, 244);">43</td><td class="pvtVal" style="background-color: rgb(255, 241, 241);">54</td><td class="pvtVal" style="background-color: rgb(255, 240, 240);">57</td><td class="pvtVal" style="background-color: rgb(255, 239, 239);">62</td><td class="pvtVal" style="background-color: rgb(255, 237, 237);">69</td><td class="pvtVal" style="background-color: rgb(255, 233, 233);">85</td><td class="pvtVal" style="background-color: rgb(255, 231, 231);">94</td><td class="pvtVal" style="background-color: rgb(255, 229, 229);">98</td><td class="pvtVal" style="background-color: rgb(255, 226, 226);">110</td><td class="pvtVal" style="background-color: rgb(255, 223, 223);">121</td><td class="pvtVal" style="background-color: rgb(255, 225, 225);">115</td><td class="pvtVal" style="background-color: rgb(255, 225, 225);">115</td><td class="pvtVal" style="background-color: rgb(255, 225, 225);">116</td><td class="pvtVal" style="background-color: rgb(255, 226, 226);">111</td><td class="pvtVal" style="background-color: rgb(255, 227, 227);">108</td><td class="pvtVal" style="background-color: rgb(255, 227, 227);">108</td><td class="pvtVal" style="background-color: rgb(255, 227, 227);">109</td><td class="pvtVal" style="background-color: rgb(255, 227, 227);">108</td><td class="pvtVal" style="background-color: rgb(255, 226, 226);">112</td><td class="pvtVal" style="background-color: rgb(255, 225, 225);">114</td><td class="pvtVal" style="background-color: rgb(255, 226, 226);">113</td><td class="pvtVal" style="background-color: rgb(255, 223, 223);">123</td><td class="pvtVal" style="background-color: rgb(255, 224, 224);">120</td></tr><tr><th class="pvtTotalLabel" colspan="3">Totals</th><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">473</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">508</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">534</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">553</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">581</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">604</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">621</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">638</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">670</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">683</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">700</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">713</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">732</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">764</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">796</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">855</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">903</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">937</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">1.03k</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">1.07k</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">1.17k</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">1.23k</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">1.26k</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">1.22k</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">1.42k</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">1.44k</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">1.47k</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">1.28k</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">1.25k</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">1.3k</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">1.33k</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">1.35k</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">1.42k</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">1.33k</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">1.38k</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">1.31k</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">1.33k</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">1.35k</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">1.49k</td><td class="pvtTotal" style="background-color: rgb(255, 255, 255);">1.53k</td></tr></tbody>\n</table>';
  //
  // exportChart({
  //   formData: {124: 456}, resultType: 'results',
  //   resultFormat: 'xlsx'
  // });

  postForm('/api/v1/chart/data ', {result_format: `from_html`, result_type: tableHTML});

  // let uri = 'data:application/vnd.ms-excel;base64,'
  //   ,
  //   template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>' + tableHTML + '</body></html>'
  //   , base64 = function (s) {
  //     return window.btoa(unescape(encodeURIComponent(s)))
  //   }
  //   , format = function (s, c) {
  //     return s.replace(/{(\w+)}/g, function (m, p) {
  //       return c[p];
  //     })
  //   };
  //
  // // Create download link element
  // let downloadLink = document.createElement("a");
  // let ctx = {worksheet: 'Лист', table: tableHTML};
  // downloadLink.href = uri + base64(format(template, ctx));
  // downloadLink.download = (filename || "exportedTable") + ".xls";
  //
  // document.body.appendChild(downloadLink);
  // downloadLink.click();
  // document.body.removeChild(downloadLink);

  // TableToExcel.convert(table, {
  //   name: (filename || "exportedTable") + ".xlsx",
  //   sheet: {
  //     name: "Лист 1"
  //   }
  // });
}


class SliceHeaderControls extends React.PureComponent {
  constructor(props) {
    super(props);
    this.toggleControls = this.toggleControls.bind(this);
    this.refreshChart = this.refreshChart.bind(this);
    this.handleMenuClick = this.handleMenuClick.bind(this);

    this.state = {
      showControls: false,
      showCrossFilterScopingModal: false,
    };
  }

  refreshChart() {
    if (this.props.updatedDttm) {
      this.props.forceRefresh(
        this.props.slice.slice_id,
        this.props.dashboardId,
      );
    }
  }

  toggleControls() {
    this.setState(prevState => ({
      showControls: !prevState.showControls,
    }));
  }

  handleMenuClick({key, domEvent}) {
    switch (key) {
      case MENU_KEYS.FORCE_REFRESH:
        this.refreshChart();
        break;
      case MENU_KEYS.CROSS_FILTER_SCOPING:
        this.setState({showCrossFilterScopingModal: true});
        break;
      case MENU_KEYS.TOGGLE_CHART_DESCRIPTION:
        this.props.toggleExpandSlice(this.props.slice.slice_id);
        break;
      case MENU_KEYS.EXPLORE_CHART:
        this.props.exploreChart(this.props.slice.slice_id);
        break;
      case MENU_KEYS.EXPORT_CSV:
        this.props.exportCSV(this.props.slice.slice_id);
        break;
      case MENU_KEYS.RESIZE_LABEL:
        this.props.handleToggleFullSize();
        break;
      case MENU_KEYS.DOWNLOAD_AS_IMAGE: {
        // menu closes with a delay, we need to hide it manually,
        // so that we don't capture it on the screenshot
        const menu = document.querySelector(
          '.ant-dropdown:not(.ant-dropdown-hidden)',
        );
        menu.style.visibility = 'hidden';
        downloadAsImage(
          SCREENSHOT_NODE_SELECTOR,
          this.props.slice.slice_name,
        )(domEvent).then(() => {
          menu.style.visibility = 'visible';
        });
        break;
      }
      default:
        break;
    }
  }

  render() {
    const {
      slice,
      isCached,
      cachedDttm,
      updatedDttm,
      componentId,
      addSuccessToast,
      addDangerToast,
      isFullSize,
      supersetCanShare,
    } = this.props;
    const crossFilterItems = getChartMetadataRegistry().items;
    const isCrossFilter = Object.entries(crossFilterItems)
    // @ts-ignore
      .filter(([, {value}]) =>
        value.behaviors?.includes(Behavior.INTERACTIVE_CHART),
      )
      .find(([key]) => key === slice.viz_type);

    const cachedWhen = cachedDttm.map(itemCachedDttm =>
      moment.utc(itemCachedDttm).fromNow(),
    );
    const updatedWhen = updatedDttm ? moment.utc(updatedDttm).fromNow() : '';
    const getCachedTitle = itemCached => {
      if (itemCached) {
        return t('Cached %s', cachedWhen);
      }
      if (updatedWhen) {
        return t('Fetched %s', updatedWhen);
      }
      return '';
    };
    const refreshTooltipData = isCached.map(getCachedTitle) || '';
    // If all queries have same cache time we can unit them to one
    let refreshTooltip = [...new Set(refreshTooltipData)];
    refreshTooltip = refreshTooltip.map((item, index) => (
      <div key={`tooltip-${index}`}>
        {refreshTooltip.length > 1
          ? `${t('Query')} ${index + 1}: ${item}`
          : item}
      </div>
    ));
    const resizeLabel = isFullSize ? t('Minimize chart') : t('Maximize chart');

    const menu = (
      <Menu
        onClick={this.handleMenuClick}
        selectable={false}
        data-test={`slice_${slice.slice_id}-menu`}
      >
        <Menu.Item
          key={MENU_KEYS.FORCE_REFRESH}
          disabled={this.props.chartStatus === 'loading'}
          style={{height: 'auto', lineHeight: 'initial'}}
          data-test="refresh-chart-menu-item"
        >
          {t('Force refresh')}
          <RefreshTooltip data-test="dashboard-slice-refresh-tooltip">
            {refreshTooltip}
          </RefreshTooltip>
        </Menu.Item>

        <Menu.Divider/>

        {slice.description && (
          <Menu.Item key={MENU_KEYS.TOGGLE_CHART_DESCRIPTION}>
            {t('Toggle chart description')}
          </Menu.Item>
        )}

        {this.props.supersetCanExplore && (
          <Menu.Item key={MENU_KEYS.EXPLORE_CHART}>
            {t('View chart in Explore')}
          </Menu.Item>
        )}

        {supersetCanShare && (
          <ShareMenuItems
            url={getDashboardUrl(
              window.location.pathname,
              getActiveFilters(),
              componentId,
            )}
            copyMenuItemTitle={t('Copy chart URL')}
            emailMenuItemTitle={t('Share chart by email')}
            emailSubject={t('Superset chart')}
            addSuccessToast={addSuccessToast}
            addDangerToast={addDangerToast}
          />
        )}

        <Menu.Item key={MENU_KEYS.RESIZE_LABEL}>{resizeLabel}</Menu.Item>

        <Menu.Item key={MENU_KEYS.DOWNLOAD_AS_IMAGE}>
          {t('Download as image')}
        </Menu.Item>

        {this.props.supersetCanCSV && (
          <Menu.Item key={MENU_KEYS.EXPORT_CSV}>{t('Export Excel')}</Menu.Item>
        )}
        {['pivot_table_v2', 'table', 'time_table'].includes(this.props.slice.viz_type) ?
          <Menu.Item onClick={() => {
            const father = document.querySelectorAll(`[data-test-chart-id="${this.props.slice.slice_id}"]`)[0];
            const tables = father.querySelectorAll('table');
            exportTableToExcelV2(tables, `${this.props.slice.slice_name}`);
          }
          }>{t('Export current table')}</Menu.Item> : null}
        {isFeatureEnabled(FeatureFlag.DASHBOARD_CROSS_FILTERS) &&
        isCrossFilter && (
          <Menu.Item key={MENU_KEYS.CROSS_FILTER_SCOPING}>
            {t('Cross-filter scoping')}
          </Menu.Item>
        )}
      </Menu>
    );

    return (
      <>
        <CrossFilterScopingModal
          chartId={slice.slice_id}
          isOpen={this.state.showCrossFilterScopingModal}
          onClose={() => this.setState({showCrossFilterScopingModal: false})}
        />
        <NoAnimationDropdown
          overlay={menu}
          trigger={['click']}
          placement="bottomRight"
          dropdownAlign={{
            offset: [-40, 4],
          }}
          getPopupContainer={triggerNode =>
            triggerNode.closest(SCREENSHOT_NODE_SELECTOR)
          }
        >
          <span
            id={`slice_${slice.slice_id}-controls`}
            role="button"
            aria-label="More Options"
          >
            <VerticalDotsTrigger/>
          </span>
        </NoAnimationDropdown>
      </>
    );
  }
}

SliceHeaderControls.propTypes = propTypes;
SliceHeaderControls.defaultProps = defaultProps;

export default SliceHeaderControls;

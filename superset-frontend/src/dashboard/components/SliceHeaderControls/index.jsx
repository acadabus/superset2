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
import { Menu, NoAnimationDropdown } from 'src/common/components';
import ShareMenuItems from 'src/dashboard/components/menu/ShareMenuItems';
import downloadAsImage from 'src/utils/downloadAsImage';
import getDashboardUrl from 'src/dashboard/util/getDashboardUrl';
import { getActiveFilters } from 'src/dashboard/util/activeDashboardFilters';
import { FeatureFlag, isFeatureEnabled } from 'src/featureFlags';
import CrossFilterScopingModal from 'src/dashboard/components/CrossFilterScopingModal/CrossFilterScopingModal';

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
  padding: ${({ theme }) => theme.gridUnit / 4}px
    ${({ theme }) => theme.gridUnit * 1.5}px;

  .dot {
    display: block;
  }

  &:hover {
    cursor: pointer;
  }
`;

const RefreshTooltip = styled.div`
  height: auto;
  margin: ${({ theme }) => theme.gridUnit}px 0;
  color: ${({ theme }) => theme.colors.grayscale.base};
  line-height: ${({ theme }) => theme.typography.sizes.m * 1.5}px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
`;

const SCREENSHOT_NODE_SELECTOR = '.dashboard-component-chart-holder';

const VerticalDotsTrigger = () => (
  <VerticalDotsContainer>
    <span className="dot" />
    <span className="dot" />
    <span className="dot" />
  </VerticalDotsContainer>
);

function exportTableToExcel(tables, filename = ''){
    let table = document.createElement('table');

    console.log(tables);
    for(let i = 0; i < tables.length; i++){
      const secTable = tables[i].cloneNode(true);
      for(let j = 0; j < secTable.children.length; j++){
        table.appendChild(secTable.children[j].cloneNode(true));
      }
    }

    console.log(table);
    const tableHTML = table.outerHTML.replace('<tfoot>', '').replace('</tfoot>', '');
    console.log(tableHTML);

    let uri = 'data:application/vnd.ms-excel;base64,'
            , template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>' + tableHTML + '</body></html>'
            , base64 = function (s) { return window.btoa(unescape(encodeURIComponent(s))) }
            , format = function (s, c) { return s.replace(/{(\w+)}/g, function (m, p) { return c[p]; }) };

    // Create download link element
    let downloadLink = document.createElement("a");
    let ctx = { worksheet: 'Лист', table: tableHTML};
    downloadLink.href = uri + base64(format(template, ctx));
    downloadLink.download = (filename||"exportedTable") + ".xls";

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
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

  handleMenuClick({ key, domEvent }) {
    switch (key) {
      case MENU_KEYS.FORCE_REFRESH:
        this.refreshChart();
        break;
      case MENU_KEYS.CROSS_FILTER_SCOPING:
        this.setState({ showCrossFilterScopingModal: true });
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
      .filter(([, { value }]) =>
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
          style={{ height: 'auto', lineHeight: 'initial' }}
          data-test="refresh-chart-menu-item"
        >
          {t('Force refresh')}
          <RefreshTooltip data-test="dashboard-slice-refresh-tooltip">
            {refreshTooltip}
          </RefreshTooltip>
        </Menu.Item>

        <Menu.Divider />

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
            exportTableToExcel(tables, `${this.props.slice.slice_name}`);
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
          onClose={() => this.setState({ showCrossFilterScopingModal: false })}
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
            <VerticalDotsTrigger />
          </span>
        </NoAnimationDropdown>
      </>
    );
  }
}

SliceHeaderControls.propTypes = propTypes;
SliceHeaderControls.defaultProps = defaultProps;

export default SliceHeaderControls;

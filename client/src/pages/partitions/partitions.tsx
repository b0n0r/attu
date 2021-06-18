import { makeStyles, Theme } from '@material-ui/core';
import { FC, useContext, useEffect, useState } from 'react';
import { PartitionManageParam, PartitionView } from './Types';
import MilvusGrid from '../../components/grid';
import { ColDefinitionsType, ToolBarConfig } from '../../components/grid/Types';
import { useTranslation } from 'react-i18next';
import { usePaginationHook } from '../../hooks/Pagination';
import icons from '../../components/icons/Icons';
import CustomToolTip from '../../components/customToolTip/CustomToolTip';
import { rootContext } from '../../context/Root';
import CreatePartition from './Create';
import { PartitionHttp } from '../../http/Partition';
import Status from '../../components/status/Status';
import { ManageRequestMethods } from '../../types/Common';

const useStyles = makeStyles((theme: Theme) => ({
  wrapper: {
    height: '100%',
  },
  icon: {
    fontSize: '20px',
    marginLeft: theme.spacing(0.5),
  },
}));

const Partitions: FC<{
  collectionName: string;
}> = ({ collectionName }) => {
  const classes = useStyles();
  const { t } = useTranslation('partition');
  const { t: successTrans } = useTranslation('success');
  const InfoIcon = icons.info;

  const [selectedPartitions, setSelectedPartitions] = useState<PartitionView[]>(
    []
  );
  const [partitions, setPartitions] = useState<PartitionView[]>([]);
  const {
    pageSize,
    currentPage,
    handleCurrentPage,
    total,
    data: partitionList,
  } = usePaginationHook(partitions);
  const [loading, setLoading] = useState<boolean>(true);
  const { setDialog, handleCloseDialog, openSnackBar } =
    useContext(rootContext);

  useEffect(() => {
    fetchPartitions(collectionName);
  }, [collectionName]);

  const fetchPartitions = async (collectionName: string) => {
    try {
      const res = await PartitionHttp.getPartitions(collectionName);

      const partitons: PartitionView[] = res.map(p =>
        Object.assign(p, { _statusElement: <Status status={p._status} /> })
      );
      setLoading(false);
      setPartitions(partitons);
    } catch (err) {
      setLoading(false);
    }
  };

  const toolbarConfigs: ToolBarConfig[] = [
    {
      label: t('create'),
      onClick: () => {
        setDialog({
          open: true,
          type: 'custom',
          params: {
            component: (
              <CreatePartition
                handleCreate={handleCreatePartition}
                handleClose={handleCloseDialog}
              />
            ),
          },
        });
      },
      icon: 'add',
    },
    {
      type: 'iconBtn',
      onClick: () => {},
      label: t('delete'),
      icon: 'delete',
    },
  ];

  const colDefinitions: ColDefinitionsType[] = [
    {
      id: '_id',
      align: 'left',
      disablePadding: true,
      label: t('id'),
    },
    {
      id: '_name',
      align: 'left',
      disablePadding: false,
      label: t('name'),
    },
    {
      id: '_statusElement',
      align: 'left',
      disablePadding: false,
      label: t('status'),
    },
    {
      id: '_rowCount',
      align: 'left',
      disablePadding: false,
      label: (
        <span className="flex-center">
          {t('rowCount')}
          <CustomToolTip title={t('tooltip')}>
            <InfoIcon classes={{ root: classes.icon }} />
          </CustomToolTip>
        </span>
      ),
    },
  ];

  const handleSelectChange = (value: PartitionView[]) => {
    setSelectedPartitions(value);
  };

  const handlePageChange = (e: any, page: number) => {
    handleCurrentPage(page);
    setSelectedPartitions([]);
  };

  const handleCreatePartition = async (name: string) => {
    const param: PartitionManageParam = {
      partitionName: name,
      collectionName,
      type: ManageRequestMethods.CREATE,
    };

    await PartitionHttp.createPartition(param);

    openSnackBar(successTrans('create', { name: t('partition') }));
    handleCloseDialog();
    // refresh partitions
    fetchPartitions(collectionName);
  };

  return (
    <section className={classes.wrapper}>
      <MilvusGrid
        toolbarConfigs={toolbarConfigs}
        colDefinitions={colDefinitions}
        rows={partitionList}
        rowCount={total}
        primaryKey="id"
        openCheckBox={true}
        showHoverStyle={true}
        selected={selectedPartitions}
        setSelected={handleSelectChange}
        page={currentPage}
        onChangePage={handlePageChange}
        rowsPerPage={pageSize}
        isLoading={loading}
      />
    </section>
  );
};

export default Partitions;
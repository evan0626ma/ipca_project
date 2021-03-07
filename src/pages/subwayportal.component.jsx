import React, { Component, useContext, useState, useEffect, useRef } from 'react';
import { Select, Form, Tabs, Card, Empty, Table, Input, Button } from 'antd';
import 'antd/dist/antd.css';
import request from '../utlize/request.utlize';
import { isEmpty } from 'lodash';
const EditableContext = React.createContext(null);

const EditableRow = ({ index, ...props }) => {
    const [form] = Form.useForm();
    return (
      <Form form={form} component={false}>
        <EditableContext.Provider value={form}>
          <tr {...props} />
        </EditableContext.Provider>
      </Form>
    );
  };

  const EditableCell = ({
    title,
    editable,
    children,
    dataIndex,
    record,
    handleSave,
    ...restProps
  }) => {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef(null);
    const form = useContext(EditableContext);
    useEffect(() => {
      if (editing) {
        inputRef.current.focus();
      }
    }, [editing]);
  
    const toggleEdit = () => {
      setEditing(!editing);
      form.setFieldsValue({
        [dataIndex]: record[dataIndex],
      });
    };
  
    const save = async () => {
      try {
        const values = await form.validateFields();
        toggleEdit();
        handleSave({ ...record, ...values });
      } catch (errInfo) {
        console.log('Save failed:', errInfo);
      }
    };
  
    let childNode = children;
  
    if (editable) {
      childNode = editing ? (
        <Form.Item
        
          name={dataIndex}
          rules={[
            {
              required: true,
              message: `${title} is required.`,
            },
          ]}
        >
          <Input ref={inputRef} onPressEnter={save} onBlur={save} />
        </Form.Item>
      ) : (
        <div
          className="editable-cell-value-wrap"
      
          onClick={toggleEdit}
        >
          {children}
        </div>
      );
    }
  
    return <td {...restProps}>{childNode}</td>;
  };
class SubwayPortal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            listLoading: true,
            storeList: [],
            productsWithSubs: [],
            productsWithoutSubs: [],
            dataLoading: false,
            currentRestaurantNumber: 0,
        };
    }

    async componentDidMount() {
        const response = await request('/getallrestaurants');
        this.setState({
            listLoading: false,
            storeList: response.data,
        });
    }

    handleSelectedStore = async value => {
        const restaurantNumber = value;
        this.setState({
            dataLoading: true,
        });
        const categoryOneResponse = await request(`/products/${restaurantNumber}/Category1`);
        const categoryTwoResponse = await request(`/products/${restaurantNumber}/Category2`);
        this.setState({
            productsWithSubs: categoryOneResponse.data.productViewModels,
            productsWithoutSubs: categoryTwoResponse.data.productViewModels,
            dataLoading: false,
            currentRestaurantNumber: value,
        });
    };

    handleSave = (row) => {
        const { productsWithSubs, productsWithoutSubs } = this.state;
        const isWithSub = productsWithSubs.findIndex((item) => row.Name === item.Name) === -1 ? false : true;
        if (isWithSub) {
                const newData = [...productsWithSubs];
                const index = newData.findIndex((item) => row.Name === item.Name);
                const item = newData[index];
                newData.splice(index, 1, { ...item, ...row });
                this.setState({
                    productsWithSubs: newData,
            });
        } else {
            const newData = [...productsWithoutSubs];
            const index = newData.findIndex((item) => row.Name === item.Name);
            const item = newData[index];
            newData.splice(index, 1, { ...item, ...row });
            this.setState({
                productsWithoutSubs: newData,
            });
        }
    };

    handleSubmit = () => {
        const { productsWithSubs, productsWithoutSubs } = this.state;
        console.log("Submitting: ");
        console.log(productsWithSubs);
        console.log("AND");
        console.log(productsWithoutSubs);
        console.log("----END----");
    };

    handleReset = () => {
        const { currentRestaurantNumber } = this.state;
        this.handleSelectedStore(currentRestaurantNumber);
    };

    setColumns = (columns) => {
        return columns.map((col) => {
            if (!col.editable) {
                return col;
              }
        
              return {
                ...col,
                onCell: (record) => ({
                    record,
                    editable: col.editable,
                    dataIndex: col.dataIndex,
                    title: col.title,
                    handleSave: this.handleSave,
                  }),
              };
        });
    }

    render() {
        const { Option } = Select;
        const { TabPane } = Tabs;
        const { listLoading, storeList, productsWithSubs, productsWithoutSubs, dataLoading, currentRestaurantNumber} = this.state;

        const columnsWithSubs = this.setColumns([
            {
                title: 'Product Name',
                dataIndex: 'Name',
                key: 'Name',
              },
              {
                title: 'Six Inch',
                  dataIndex: 'SixInchPrice',
                  width: '30%',
                  key: 'Name',
                editable: true,
              },
              {
                title: 'Foot long',
                  dataIndex: 'FootLongPrice',
                  width: '30%',
                  key: 'Name',
                editable: true,
              },
        ]);
        const columnsWithoutSubs = this.setColumns([
            {
                title: 'Product Name',
                dataIndex: 'Name',
                key: 'Name',
              },
              {
                title: 'Standard',
                  dataIndex: 'StandardPrice',
                  width: '30%',
                  key: 'Name',
                editable: true,
              },
        ]);
        const components = {
            body: {
              row: EditableRow,
              cell: EditableCell,
            },
        };

        return (
            <div>
                <h2>Subway Portal</h2>
                <Select
                    style={{ width: 200 }}
                    loading={listLoading}
                    placeholder='Select store'
                    onSelect={this.handleSelectedStore}
                >
                    {
                        storeList.map(store => (
                            <Option
                                key={store.RestaurantId}
                                value={store.RestaurantNumber}
                            >
                                {store.RestaurantName}
                            </Option>
                        ))
                    }
                </Select>
                {isEmpty(productsWithSubs) && isEmpty(productsWithoutSubs) && currentRestaurantNumber === 0 ?
                    <span/> : 
                    <Card loading={dataLoading}>
                        <Form>
                            <Tabs defaultActiveKey="1">
                                <TabPane tab="Subs" key="1">
                                    {isEmpty(productsWithSubs) ? 
                                        <Empty/> : 
                                        <Table
                                            components={components}
                                            rowClassName={() => 'editable-row'}
                                            bordered
                                            dataSource={productsWithSubs}
                                            columns={columnsWithSubs}
                                            pagination={false}
                                        />
                                        }
                                </TabPane>
                                <TabPane tab="Non subs" key="2">
                                {isEmpty(productsWithoutSubs) ? 
                                        <Empty
                                        description={
                                            <span>
                                              No data is available.
                                            </span>
                                          }
                                        /> : 
                                        <Table
                                            components={components}
                                            rowClassName={() => 'editable-row'}
                                            bordered
                                            dataSource={productsWithoutSubs}
                                            columns={columnsWithoutSubs}
                                            pagination={false}
                                        />
                                        }
                                </TabPane>
                            </Tabs>
                            <Button onClick={() => this.handleSubmit()}>Submit</Button>
                            <Button onClick={() => this.handleReset()}>Reset</Button>
                        </Form>
                    </Card>
                }
            </div>
        );
    };
}
export default SubwayPortal;
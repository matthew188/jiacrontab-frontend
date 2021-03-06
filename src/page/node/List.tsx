import * as React from 'react'
import { Table, Button, Form, Input, Tabs } from 'antd'
import BaseLayout from '../../layout/BaseLayout'
import API from '../../config/api'
import { getRequest, getGroupID } from '../../utils/utils'
import './List.css'

const FormItem = Form.Item
const { TabPane } = Tabs
const EditableContext = React.createContext('huahua')

const EditableRow = ({ form, index, ...props }: any) => (
    <EditableContext.Provider value={form}>
        <tr {...props} />
    </EditableContext.Provider>
)

const EditableFormRow = Form.create()(EditableRow)

interface EditorCell {
    editable: boolean
    record: object
    handleSave: any
    form: any
    dataIndex: string
    title: string
    index: number
}

// ...restProps
class EditableCell extends React.Component<EditorCell> {
    constructor(props: EditorCell) {
        super(props)
    }
    state = {
        editing: false
    }

    componentDidMount() {
        if (this.props.editable) {
            document.addEventListener('click', this.handleClickOutside, true)
        }
    }

    componentWillUnmount() {
        if (this.props.editable) {
            document.removeEventListener('click', this.handleClickOutside, true)
        }
    }

    toggleEdit = () => {
        const editing = !this.state.editing
        this.setState({ editing })
    }

    handleClickOutside = (e: any) => { }

    save = (record: any, form: any) => {
        form.validateFields((error: object, values: any) => {
            if (error) {
                return
            }
            this.toggleEdit()
            this.props.handleSave({ ...record, ...values })
        })
    }

    render() {
        const { editing } = this.state
        const {
            editable,
            dataIndex,
            title,
            record,
            index,
            handleSave,
            ...restProps
        } = this.props
        return (
            <td>
                {editable ? (
                    <EditableContext.Consumer>
                        {(form: any) => {
                            // this.form = form;
                            return editing ? (
                                <FormItem style={{ margin: 0 }}>
                                    {form.getFieldDecorator(dataIndex, {
                                        rules: [
                                            {
                                                required: true,
                                                message: `${title}不能为空`
                                            }
                                        ],
                                        initialValue: record[dataIndex]
                                    })(
                                        <Input
                                            onBlur={() => {
                                                this.save(record, form)
                                            }}
                                        />
                                    )}
                                </FormItem>
                            ) : (
                                    <div
                                        className="editable-cell-value-wrap"
                                        style={{ paddingRight: 24 }}
                                        onClick={this.toggleEdit}
                                    >
                                        {restProps.children}
                                    </div>
                                )
                        }}
                    </EditableContext.Consumer>
                ) : (
                        restProps.children
                    )}
            </td>
        )
    }
}

interface T {
    history: any
}
interface Data {
    total: number
    page: number
    pageSize: number
    searchTxt: string
    token: string | null
    status: number
}

interface State {
    loading: boolean
    nodeListData: any[]
    isFocus: boolean
}

class UserNode extends React.Component<T> {
    constructor(props: any) {
        super(props)
    }

    public data: Data = {
        total: 0,
        page: 1,
        token: '',
        searchTxt: '',
        status: 0,
        pageSize: 20
    }

    public state: State = {
        loading: true,
        nodeListData: [],
        isFocus: false
    }
    public componentDidMount(): void {
        if (window.localStorage) {
            this.data.token = localStorage.getItem('jiaToken')
            this.getNodeList(this.data.token)
        }
    }

    private tabChange = (activeKey: string) => {
        this.data.page = 1
        this.data.pageSize = 20
        this.setState({
            loading: true
        })
        if (activeKey == '1') {
            this.data.status = 0
        }
        if (activeKey == '2') {
            this.data.status = 1
        }
        if (activeKey == '3') {
            this.data.status = 2
        }
        this.getNodeList(this.data.token)
    }

    private getNodeList = (jiaToken: string | null) => {
        this.setState({
            loading: true
        })
        getRequest({
            url: API.NodeList,
            token: jiaToken,
            data: {
                queryGroupID: getGroupID(),
                queryStatus: this.data.status,
                page: this.data.page,
                pagesize: this.data.pageSize,
                searchTxt: this.data.searchTxt,
            },
            succ: (data: any) => {
                let nodes = JSON.parse(data)
                this.data.total = nodes.total
                this.setState(
                    {
                        loading: false
                    },
                    () => {
                        this.setState({
                            nodeListData: nodes.list
                        })
                    }
                )
            },
            error: () => {
                this.setState({
                    loading: false
                })
            },
            catch: () => {
                this.setState({
                    loading: false
                })
            }
        })
    }

    public handleSee(record: any) {
        let params: any = {
            // id:record.ID,
            addr: record.addr
        }
        let path: any = {
            pathname: '/node/detail',
            search: `?addr=${params.addr}`
        }
        this.props.history.push(path)
    }

    private reload() {
        this.getNodeList(this.data.token)
    }

    private handleSave = (row: object) => {
        const newData: any[] = [...this.state.nodeListData]
        const index: number = newData.findIndex(
            (item: object) => row['ID'] === item['ID']
        )
        const item: object = newData[index]
        newData.splice(index, 1, {
            ...item,
            ...row
        })
        this.setState({ nodeListData: newData })
    }

    public render(): any {
        const components = {
            body: {
                row: EditableFormRow,
                cell: EditableCell
            }
        }
        const columns: any[] = [
            {
                title: '序号',
                dataIndex: 'ID',
                key: 'ID',
                width: 70,
                sorter: (a: any, b: any) => a.ID - b.ID
            },
            { title: '名称', dataIndex: 'name', key: 'name' },
            {
                title: '地址',
                dataIndex: 'addr',
                maxWidth: '200px',
                key: 'addr'
            },
            {
                title: '状态',
                dataIndex: 'disabled',
                key: 'disabled',
                render: (record: any) => {
                    if (!record) {
                        return <span style={{ color: 'green' }}>正常</span>
                    } else {
                        return <span style={{ color: 'red' }}>断开</span>
                    }
                }
            },
            { title: '分组', dataIndex: 'group.name', key: 'group.name' },
            {
                title: '运行的定时任务',
                dataIndex: 'crontabTaskNum',
                key: 'crontabTaskNum'
            },
            {
                title: '运行的常驻任务',
                dataIndex: 'daemonTaskNum',
                key: 'daemonTaskNum'
            },
            {
                title: '待审核的定时任务',
                dataIndex: 'crontabJobAuditNum',
                key: 'crontabJobAuditNum'
            },
            {
                title: '待审核的常驻任务',
                dataIndex: 'daemonJobAuditNum',
                key: 'daemonJobAuditNum'
            },
            {
                title: '执行失败的定时任务',
                dataIndex: 'crontabJobFailNum',
                key: 'crontabJobFailNum'
            },
            {
                title: '操作',
                key: 'operation',
                render: (record: any) => {
                    if (!record.disabled) {
                        return (
                            <Button
                                href="javascript:;"
                                htmlType="button"
                                size="small"
                                type="primary"
                                onClick={() => {
                                    this.handleSee(record)
                                }}
                            >
                                查看
                            </Button>
                        )
                    }
                    return (
                        <Button
                            disabled={true}
                            size="small"
                            href="javascript:;"
                            htmlType="button"
                            type="primary"
                            onClick={() => {
                                this.handleSee(record)
                            }}
                        >
                            查看
                        </Button>
                    )
                }
            }
        ]

        const runColumns = columns.map(col => {
            if (!col.editable) {
                return col
            }
            return {
                ...col,
                onCell: (record: object) => ({
                    record,
                    editable: col.editable,
                    dataIndex: col.dataIndex,
                    title: col.title,
                    handleSave: this.handleSave
                })
            }
        })

        const runData: any[] = this.state.nodeListData
        const { Search } = Input
        return (
            <BaseLayout pages="nodeList">
                <div className="jia-content">
                <Tabs
                defaultActiveKey="1"
                onChange={this.tabChange}
                style={{
                    background: '#fff',
                        padding: '0 16px'
                }}
                >

                    <TabPane tab="全部节点列表" key="1">
                    </TabPane>
                    <TabPane tab="活跃节点列表" key="2">
                    </TabPane>
                    <TabPane tab="失联节点列表" key="3">
                    </TabPane>

                    </Tabs>
                <div className="jia-table">
                    <Search
                            placeholder="节点名"
                            onSearch={value => {
                                this.data.searchTxt = value
                                this.data.page = 1
                                this.reload()
                            }}
                            enterButton="查询"
                            style={{ width: 350, marginBottom: 10 }}
                        />

                        <Table
                            style={{
                                wordWrap: 'break-word',
                                wordBreak: 'break-all'
                            }}
                            pagination={{
                                total: this.data.total,
                                pageSize: this.data.pageSize,
                                defaultCurrent: this.data.page,
                                showSizeChanger: true,
                                pageSizeOptions: ['1', '10', '20', '50', '100'],
                                onShowSizeChange: (
                                    current: number,
                                    pageSize: number
                                ) => {
                                    this.data.page = 1
                                    this.data.pageSize = pageSize
                                    this.reload()
                                },
                                onChange: (page: number) => {
                                    this.data.page = page
                                    this.reload()
                                }
                            }}
                            bordered
                            rowKey="ID"
                            size="small"
                            loading={this.state.loading}
                            components={components}
                            rowClassName={() => 'editable-row'}
                            dataSource={runData}
                            columns={runColumns}
                        />

                    </div>
                </div>
            </BaseLayout>
        )
    }
}

export default UserNode

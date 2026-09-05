import { useState, useEffect, useCallback } from 'react';
import { getSummary, getTransactions, createTransaction, updateTransaction, deleteTransaction } from './api';
import {
  ConfigProvider, Button, List, Card, Statistic, Row, Col, Modal, Form, Input,
  Select, DatePicker, InputNumber, Popconfirm, message,
} from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import './App.css';

const theme = {
  token: {
    colorPrimary: '#1f1d1a',
    colorInfo: '#1f1d1a',
    colorBgLayout: '#f6f4ef',
    colorTextBase: '#262420',
    colorTextSecondary: '#7b7468',
    colorBorder: '#e3ded4',
    colorBorderSecondary: '#eeebe3',
    borderRadius: 10,
    controlHeight: 36,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
  components: {
    Card: { borderRadiusLG: 14 },
  },
};

const INCOME_COLOR = '#16a34a';
const EXPENSE_COLOR = '#dc2626';

const TYPE_OPTIONS = [
  { value: 'income', label: '收入' },
  { value: 'expense', label: '支出' },
];

const CATEGORIES = {
  income: ['工资', '奖金', '理财', '兼职', '退款', '其他'],
  expense: ['餐饮', '交通', '购物', '居住', '水电', '娱乐', '医疗', '人情', '其他'],
};

function App() {
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 });
  const [list, setList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const type = Form.useWatch('type', form) || 'expense';

  useEffect(() => {
    if (!isModalOpen) return;
    if (editing) {
      form.setFieldsValue({
        type: editing.type,
        amount: editing.amount,
        category: editing.category,
        date: dayjs(editing.date),
        note: editing.note || '',
      });
    } else {
      form.resetFields();
    }
  }, [isModalOpen, editing, form]);

  const openCreate = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setIsModalOpen(true);
  };

  const fetchMonthData = useCallback(async (m) => {
    const [summaryRes, listRes] = await Promise.all([
      getSummary(m),
      getTransactions(m),
    ]);
    return { summary: summaryRes.data, list: listRes.data };
  }, []);

  useEffect(() => {
    let active = true;
    fetchMonthData(month)
      .then((data) => {
        if (!active) return;
        setSummary(data.summary);
        setList(data.list);
      })
      .catch(() => {
        if (active) message.error('加载数据失败，请确保后端已启动');
      });
    return () => { active = false; };
  }, [month, fetchMonthData]);

  const reload = async () => {
    const data = await fetchMonthData(month);
    setSummary(data.summary);
    setList(data.list);
  };

  const categoryOptions = (() => {
    const base = CATEGORIES[type].map((c) => ({ value: c, label: c }));
    if (editing && !CATEGORIES[type].includes(editing.category)) {
      base.unshift({ value: editing.category, label: editing.category });
    }
    return base;
  })();

  const handleFinish = async (values) => {
    try {
      const payload = { ...values, date: values.date.format('YYYY-MM-DD') };
      if (editing) {
        await updateTransaction(editing.id, payload);
        message.success('修改成功！');
      } else {
        await createTransaction(payload);
        message.success('记账成功！');
      }
      setIsModalOpen(false);
      form.resetFields();
      await reload();
    } catch {
      message.error('保存失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTransaction(id);
      await reload();
      message.success('已删除');
    } catch {
      message.error('删除失败');
    }
  };

  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">记账本</h1>
            <div className="page-sub">记录每一笔收支</div>
          </div>
          <DatePicker
            picker="month"
            value={dayjs(month, 'YYYY-MM')}
            onChange={(v) => v && setMonth(v.format('YYYY-MM'))}
            allowClear={false}
          />
        </header>

        <Row gutter={[12, 12]}>
          <Col xs={24} sm={8}>
            <Card className="stat-card">
              <Statistic title="收入" value={summary.total_income} precision={2} prefix="¥"
                valueStyle={{ color: INCOME_COLOR }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card">
              <Statistic title="支出" value={summary.total_expense} precision={2} prefix="¥"
                valueStyle={{ color: EXPENSE_COLOR }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card">
              <Statistic title="结余" value={summary.balance} precision={2} prefix="¥" />
            </Card>
          </Col>
        </Row>

        <Button type="primary" size="large" block className="add-btn" onClick={openCreate}>
          + 记一笔
        </Button>

        <Card className="txn-card">
          <List
            dataSource={list}
            locale={{ emptyText: <div className="txn-empty">本月还没有记录，点上方按钮记一笔吧</div> }}
            renderItem={(item) => (
              <List.Item className="txn-item">
                <div className="txn-main">
                  <div className="txn-info">
                    <div className="txn-category">{item.category}</div>
                    <div className="txn-date">
                      {dayjs(item.date).format('M月D日')}
                      {item.note ? ` · ${item.note}` : ''}
                    </div>
                  </div>
                  <div
                    className="txn-amount"
                    style={{ color: item.type === 'income' ? INCOME_COLOR : EXPENSE_COLOR }}
                  >
                    {item.type === 'income' ? '+' : '-'}¥{Number(item.amount).toFixed(2)}
                  </div>
                  <div className="txn-actions">
                    <Button type="text" size="small" onClick={() => openEdit(item)}>编辑</Button>
                    <Popconfirm title="删除这笔记录？" onConfirm={() => handleDelete(item.id)}>
                      <Button type="text" size="small" danger className="txn-delete">删除</Button>
                    </Popconfirm>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </Card>

        <Modal title={editing ? '修改记录' : '记一笔'} open={isModalOpen}
          onCancel={() => setIsModalOpen(false)} footer={null}>
          <Form form={form} onFinish={handleFinish} layout="vertical"
            initialValues={{ type: 'expense', date: dayjs() }}>
            <Form.Item name="type" label="类型" rules={[{ required: true }]}>
              <Select options={TYPE_OPTIONS} onChange={() => form.setFieldsValue({ category: undefined })} />
            </Form.Item>
            <Form.Item name="amount" label="金额" rules={[{ required: true, message: '请输入金额' }]}>
              <InputNumber min={0.01} precision={2} controls={false} prefix="¥" style={{ width: '100%' }}
                placeholder="0.00" />
            </Form.Item>
            <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
              <Select placeholder="请选择分类" options={categoryOptions} />
            </Form.Item>
            <Form.Item name="date" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="note" label="备注">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              {editing ? '保存修改' : '保存'}
            </Button>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
}

export default App;

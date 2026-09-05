import React, { useState, useEffect } from 'react';
import { getSummary, getTransactions, createTransaction, deleteTransaction } from './api';
import { Button, List, Card, Statistic, Row, Col, Modal, Form, Input, Select, DatePicker, message, Space } from 'antd';
import dayjs from 'dayjs';

function App() {
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 });
  const [list, setList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const loadData = async () => {
    try {
      const [summaryRes, listRes] = await Promise.all([
        getSummary(month),
        getTransactions(month)
      ]);
      setSummary(summaryRes.data);
      setList(listRes.data);
    } catch (error) {
      message.error('加载数据失败，请确保后端已启动');
    }
  };

  useEffect(() => { loadData(); }, [month]);

  const handleFinish = async (values) => {
    try {
      await createTransaction({ ...values, date: values.date.format('YYYY-MM-DD') });
      setIsModalOpen(false);
      form.resetFields();
      loadData();
      message.success('记账成功！');
    } catch (error) {
      message.error('记账失败');
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <h1>💰 我的记账本</h1>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{ padding: 5 }}
        />
      </Space>

      <Row gutter={16} style={{ margin: '20px 0' }}>
        <Col span={8}><Card><Statistic title="收入" value={summary.total_income} prefix="¥" valueStyle={{ color: '#3f8600' }}/></Card></Col>
        <Col span={8}><Card><Statistic title="支出" value={summary.total_expense} prefix="¥" valueStyle={{ color: '#cf1322' }}/></Card></Col>
        <Col span={8}><Card><Statistic title="结余" value={summary.balance} prefix="¥" /></Card></Col>
      </Row>

      <Button type="primary" size="large" block onClick={() => setIsModalOpen(true)} style={{ marginBottom: 20 }}>
        + 记一笔
      </Button>

      <List
        dataSource={list}
        renderItem={(item) => (
          <List.Item
            actions={[
              <a key="delete" onClick={async () => { await deleteTransaction(item.id); loadData(); }}>删除</a>
            ]}
          >
            <List.Item.Meta
              title={`${item.category} ${item.type === 'income' ? '+' : '-'}¥${item.amount}`}
              description={`${item.date} ${item.note}`}
            />
          </List.Item>
        )}
      />

      <Modal title="记一笔" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
        <Form form={form} onFinish={handleFinish} layout="vertical">
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="income">收入</Select.Option>
              <Select.Option value="expense">支出</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Input placeholder="如：餐饮、交通" />
          </Form.Item>
          <Form.Item name="date" label="日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} defaultValue={dayjs()} />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>保存</Button>
        </Form>
      </Modal>
    </div>
  );
}

export default App;
import React, { useState, useEffect, useMemo } from "react";
import { Card, Button, Input, Modal, List, Popconfirm, message, Tag, Select, Empty, Space, Divider } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  ApiOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useApiStore, ApiConfig, ApiProvider } from "../store/apiStore";

const providerOptions = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "azure", label: "Azure OpenAI" },
  { value: "ollama", label: "Ollama" },
  { value: "alibaba", label: "阿里云通义千问" },
  { value: "baidu", label: "百度文心一言" },
  { value: "zhipu", label: "智谱AI" },
  { value: "xunfei", label: "讯飞星火" },
  { value: "moonshot", label: "月之暗面 Kimi" },
  { value: "baichuan", label: "百川智能" },
  { value: "minimax", label: "MiniMax" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "doubao", label: "字节豆包" },
  { value: "tencent", label: "腾讯混元" },
  { value: "siliconflow", label: "SiliconFlow" },
  { value: "custom", label: "自定义" },
];

const Apis: React.FC = () => {
  const { configs, activeConfigId, testingConfigId, testResults, addConfig, updateConfig, deleteConfig, setActiveConfig, testConfig } = useApiStore();

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "api-storage") {
        useApiStore.persist.rehydrate();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filterProvider, setFilterProvider] = useState<ApiProvider | null>(null);

  // 表单状态
  const [formName, setFormName] = useState("");
  const [formProvider, setFormProvider] = useState<ApiProvider>("openai");
  const [formApiKey, setFormApiKey] = useState("");
  const [formBaseUrl, setFormBaseUrl] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formAzureDeployment, setFormAzureDeployment] = useState("");
  const [formAzureApiVersion, setFormAzureApiVersion] = useState("2024-02-15-preview");
  const [formCustomHeaders, setFormCustomHeaders] = useState("");

  // 过滤后的配置
  const filteredConfigs = useMemo(() => {
    return configs.filter((config) => {
      if (filterProvider && config.provider !== filterProvider) {
        return false;
      }
      if (searchText) {
        const search = searchText.toLowerCase();
        return (
          config.name.toLowerCase().includes(search) ||
          config.provider.toLowerCase().includes(search) ||
          config.model.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [configs, filterProvider, searchText]);

  const resetForm = () => {
    setFormName("");
    setFormProvider("openai");
    setFormApiKey("");
    setFormBaseUrl("");
    setFormModel("");
    setFormAzureDeployment("");
    setFormAzureApiVersion("2024-02-15-preview");
    setFormCustomHeaders("");
    setEditId(null);
    setIsEditMode(false);
  };

  const handleOpenModal = (isEdit = false) => {
    resetForm();
    setIsEditMode(isEdit);
    setIsModalOpen(true);
  };

  const handleEdit = (config: ApiConfig) => {
    setEditId(config.id);
    setFormName(config.name);
    setFormProvider(config.provider);
    setFormApiKey(config.apiKey);
    setFormBaseUrl(config.baseUrl);
    setFormModel(config.model);
    setFormAzureDeployment(config.azureDeployment || "");
    setFormAzureApiVersion(config.azureApiVersion || "2024-02-15-preview");
    setFormCustomHeaders(config.customHeaders ? JSON.stringify(config.customHeaders, null, 2) : "");
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const getDefaultBaseUrl = (provider: ApiProvider) => {
    switch (provider) {
      case "openai": return "https://api.openai.com";
      case "anthropic": return "https://api.anthropic.com";
      case "ollama": return "http://localhost:11434";
      case "azure": return "https://your-resource.openai.azure.com";
      case "alibaba": return "https://dashscope.aliyuncs.com";
      case "baidu": return "https://aip.baidubce.com";
      case "zhipu": return "https://open.bigmodel.cn";
      case "xunfei": return "https://spark-api-open.xf-yun.com";
      case "moonshot": return "https://api.moonshot.cn";
      case "baichuan": return "https://api.baichuan-ai.com";
      case "minimax": return "https://api.minimax.chat";
      case "deepseek": return "https://api.deepseek.com";
      case "doubao": return "https://ark.cn-beijing.volces.com";
      case "tencent": return "https://hunyuan.tencentcloudapi.com";
      case "siliconflow": return "https://api.siliconflow.cn";
      default: return "";
    }
  };

  const handleProviderChange = (provider: ApiProvider) => {
    setFormProvider(provider);
    if (!isEditMode) {
      setFormBaseUrl(getDefaultBaseUrl(provider));
    }
  };

  const handleCreate = () => {
    if (!formName.trim()) {
      message.warning("请输入名称");
      return;
    }
    if (!formApiKey.trim()) {
      message.warning("请输入 API Key");
      return;
    }
    if (!formBaseUrl.trim()) {
      message.warning("请输入 Base URL");
      return;
    }
    if (!formModel.trim()) {
      message.warning("请输入模型");
      return;
    }

    let customHeaders: Record<string, string> | undefined;
    if (formCustomHeaders.trim()) {
      try {
        customHeaders = JSON.parse(formCustomHeaders);
      } catch {
        message.warning("自定义请求头格式 JSON 错误");
        return;
      }
    }

    const id = Date.now().toString();
    const newConfig: ApiConfig = {
      id,
      name: formName,
      provider: formProvider,
      apiKey: formApiKey,
      baseUrl: formBaseUrl,
      model: formModel,
      azureDeployment: formProvider === "azure" ? formAzureDeployment : undefined,
      azureApiVersion: formProvider === "azure" ? formAzureApiVersion : undefined,
      customHeaders,
      enabled: true,
      createTime: new Date().toLocaleString(),
      updateTime: new Date().toLocaleString(),
    };
    addConfig(newConfig);
    setIsModalOpen(false);
    resetForm();
    message.success("API 配置创建成功");
  };

  const handleUpdate = () => {
    if (!formName.trim() || !editId) {
      message.warning("请输入名称");
      return;
    }

    let customHeaders: Record<string, string> | undefined;
    if (formCustomHeaders.trim()) {
      try {
        customHeaders = JSON.parse(formCustomHeaders);
      } catch {
        message.warning("自定义请求头格式 JSON 错误");
        return;
      }
    }

    updateConfig(editId, {
      name: formName,
      provider: formProvider,
      apiKey: formApiKey,
      baseUrl: formBaseUrl,
      model: formModel,
      azureDeployment: formProvider === "azure" ? formAzureDeployment : undefined,
      azureApiVersion: formProvider === "azure" ? formAzureApiVersion : undefined,
      customHeaders,
    });
    setIsModalOpen(false);
    resetForm();
    message.success("API 配置更新成功");
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConfig(id);
    message.success("已删除");
  };

  const handleTest = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await testConfig(id);
    if (result.success) {
      message.success(`连接成功 (${result.latency}ms)`);
    } else {
      message.error(`连接失败: ${result.message}`);
    }
  };

  const handleSetActive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveConfig(id);
    message.success("已设为当前使用");
  };

  const getProviderColor = (provider: ApiProvider) => {
    switch (provider) {
      case "openai": return "green";
      case "anthropic": return "orange";
      case "azure": return "blue";
      case "ollama": return "purple";
      case "alibaba": return "orange";
      case "baidu": return "blue";
      case "zhipu": return "cyan";
      case "xunfei": return "red";
      case "moonshot": return "magenta";
      case "baichuan": return "volcano";
      case "minimax": return "geekblue";
      case "deepseek": return "blue";
      case "doubao": return "gold";
      case "tencent": return "green";
      case "siliconflow": return "purple";
      default: return "default";
    }
  };

  const getProviderLabel = (provider: ApiProvider) => {
    return providerOptions.find((p) => p.value === provider)?.label || provider;
  };

  const showAzureFields = formProvider === "azure";

  return (
    <div className="content-section">
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ApiOutlined style={{ color: "var(--color-primary)" }} />
            <span>API 配置</span>
            <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontWeight: "normal" }}>
              ({filteredConfigs.length} 个)
            </span>
          </div>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal(false)} className="btn-press">
            新建
          </Button>
        }
        style={{ marginTop: 8, height: "calc(100vh - 128px)", overflow: "hidden" }}
        className="card-hoverable"
      >
        <div style={{ marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Input
            placeholder="搜索名称或模型..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="筛选 Provider"
            value={filterProvider}
            onChange={setFilterProvider}
            style={{ width: 150 }}
            allowClear
            options={providerOptions}
          />
        </div>

        <div style={{ height: "calc(100% - 80px)", overflowY: "auto", paddingRight: "10px" }}>
          {filteredConfigs.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: "var(--color-text-tertiary)" }}>
                  暂无 API 配置，点击"新建"创建第一个配置
                </span>
              }
              style={{ marginTop: 80 }}
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal(false)}>
                新建配置
              </Button>
            </Empty>
          ) : (
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3 }}
              dataSource={filteredConfigs}
              renderItem={(item) => (
                <List.Item>
                  <Card
                    hoverable
                    className="card-hoverable"
                    style={{
                      background: "var(--color-bg-base)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-lg)",
                      borderColor: activeConfigId === item.id ? "var(--color-primary)" : undefined,
                    }}
                    title={
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                          <ApiOutlined style={{ color: "var(--color-primary)" }} />
                          {item.name}
                        </span>
                        {activeConfigId === item.id && (
                          <Tag color="var(--color-primary)" style={{ background: "rgba(99, 102, 241, 0.15)", border: "none" }}>
                            使用中
                          </Tag>
                        )}
                      </div>
                    }
                    extra={
                      <Space>
                        {testingConfigId === item.id ? (
                          <LoadingOutlined spin />
                        ) : (
                          <Button type="link" size="small" onClick={(e) => handleTest(item.id, e)}>
                            测试
                          </Button>
                        )}
                        <Button type="link" size="small" onClick={(e) => handleSetActive(item.id, e)}>
                          设为当前
                        </Button>
                        <Button type="text" icon={<EditOutlined />} size="small" onClick={(e) => { e.stopPropagation(); handleEdit(item); }} />
                        <Popconfirm title="确定删除吗?" onConfirm={(e) => handleDelete(item.id, e as any)} onCancel={(e) => e?.stopPropagation()} okText="确定" cancelText="取消">
                          <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={(e) => e.stopPropagation()} />
                        </Popconfirm>
                      </Space>
                    }
                  >
                    <Space wrap style={{ marginBottom: 12 }}>
                      <Tag color={getProviderColor(item.provider)}>{getProviderLabel(item.provider)}</Tag>
                      <Tag>{item.model}</Tag>
                      {testingConfigId === item.id ? (
                        <Tag icon={<LoadingOutlined spin />} color="processing">测试中</Tag>
                      ) : testResults[item.id] ? (
                        testResults[item.id].success ? (
                          <Tag icon={<CheckCircleOutlined />} color="success">可用 ({testResults[item.id].latency}ms)</Tag>
                        ) : (
                          <Tag icon={<CloseCircleOutlined />} color="error">不可用</Tag>
                        )
                      ) : null}
                    </Space>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 8 }}>
                      <div>Base URL: {item.baseUrl}</div>
                      {item.provider === "azure" && item.azureDeployment && (
                        <div>Deployment: {item.azureDeployment}</div>
                      )}
                      {testResults[item.id] && !testResults[item.id].success && (
                        <div style={{ color: "#ff4d4f", marginTop: 4 }}>{testResults[item.id].message}</div>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", display: "flex", justifyContent: "space-between" }}>
                      <span>创建于 {item.createTime}</span>
                      {testResults[item.id] && <span>测试于 {testResults[item.id].time}</span>}
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          )}
        </div>
      </Card>

      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PlusOutlined style={{ color: "var(--color-primary)" }} />
            {isEditMode ? "编辑配置" : "新建配置"}
          </div>
        }
        open={isModalOpen}
        onOk={isEditMode ? handleUpdate : handleCreate}
        onCancel={() => { setIsModalOpen(false); resetForm(); }}
        width={550}
        okText={isEditMode ? "保存" : "创建"}
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, color: "var(--color-text-secondary)" }}>名称 *</div>
          <Input placeholder="例如: My OpenAI" value={formName} onChange={(e) => setFormName(e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, color: "var(--color-text-secondary)" }}>Provider *</div>
          <Select style={{ width: "100%" }} value={formProvider} onChange={handleProviderChange} options={providerOptions} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, color: "var(--color-text-secondary)" }}>API Key *</div>
          <Input.Password placeholder="请输入 API Key" value={formApiKey} onChange={(e) => setFormApiKey(e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, color: "var(--color-text-secondary)" }}>Base URL *</div>
          <Input placeholder="例如: https://api.openai.com" value={formBaseUrl} onChange={(e) => setFormBaseUrl(e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, color: "var(--color-text-secondary)" }}>模型 *</div>
          <Input placeholder="例如: gpt-4o" value={formModel} onChange={(e) => setFormModel(e.target.value)} />
        </div>
        {showAzureFields && (
          <>
            <Divider style={{ margin: "16px 0" }}>Azure 专用配置</Divider>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, color: "var(--color-text-secondary)" }}>Deployment Name *</div>
              <Input placeholder="例如: gpt-4o" value={formAzureDeployment} onChange={(e) => setFormAzureDeployment(e.target.value)} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, color: "var(--color-text-secondary)" }}>API Version</div>
              <Input placeholder="例如: 2024-02-15-preview" value={formAzureApiVersion} onChange={(e) => setFormAzureApiVersion(e.target.value)} />
            </div>
          </>
        )}
        {formProvider === "custom" && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, color: "var(--color-text-secondary)" }}>自定义请求头 (JSON)</div>
            <Input.TextArea placeholder='{"X-Custom-Header": "value"}' value={formCustomHeaders} onChange={(e) => setFormCustomHeaders(e.target.value)} rows={3} />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Apis;